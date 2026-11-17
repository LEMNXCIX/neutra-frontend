/**
 * Global Start request middleware: CSRF filtering and tenant context.
 *
 * The real Start handler needs a built router and Vite virtual entries, so this
 * test drives the middleware chain returned by `startInstance.getOptions()`
 * directly and calls `getTenantContext()` from a stand-in server-function
 * handler. That is the same contract Start's request phase uses: middlewares
 * run in order, each `next({ context })` is merged, and the resulting context
 * becomes `contextAfterGlobalMiddlewares` for the handler.
 */
import { runWithStartContext } from "@tanstack/start-storage-context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTenantContext } from "@/lib/server-context";
import { startInstance } from "@/start";

type MiddlewareLike = {
    options: { server?: (ctx: Record<string, unknown>) => unknown };
};

type PipelineContext = {
    request: Request;
    pathname: string;
    context: Record<string, unknown>;
    handlerType: "serverFn" | "router";
};

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BACKEND_API_URL", "http://localhost:4000/api");
    mockFetch.mockImplementation(
        async (input: RequestInfo | URL, _init?: RequestInit) => {
            const url =
                typeof input === "string"
                    ? input
                    : input instanceof URL
                      ? input.toString()
                      : input.url;
            if (url.includes("/tenants/config/")) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: { type: "STORE", id: "tenant-uuid-1" },
                    }),
                } as Response;
            }
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        },
    );
});

/**
 * Run the registered request middlewares around a server-function handler.
 * A middleware that returns a `Response` (CSRF failure) short-circuits the
 * chain, exactly as it does inside `createStartHandler`.
 */
async function runPipeline(
    request: Request,
    handlerType: "serverFn" | "router",
) {
    const options = await startInstance.getOptions();
    const middlewares = (options.requestMiddleware ?? []) as MiddlewareLike[];
    let index = 0;

    const terminal = (ctx: PipelineContext) =>
        runWithStartContext(
            {
                getRouter: () => Promise.resolve({}) as never,
                request: ctx.request,
                startOptions: options,
                contextAfterGlobalMiddlewares: ctx.context,
                handlerType,
            },
            () => ({
                request: ctx.request,
                pathname: ctx.pathname,
                context: ctx.context,
                response: new Response(JSON.stringify(getTenantContext()), {
                    headers: { "content-type": "application/json" },
                }),
            }),
        );

    const dispatch = async (ctx: PipelineContext): Promise<unknown> => {
        const middleware = middlewares[index++];
        if (!middleware) return terminal(ctx);
        return middleware.options.server?.({
            ...ctx,
            next: async (nextOpts?: { context?: Record<string, unknown> }) =>
                dispatch({
                    ...ctx,
                    context: { ...ctx.context, ...(nextOpts?.context ?? {}) },
                }),
        });
    };

    return dispatch({
        request,
        pathname: new URL(request.url).pathname,
        context: {},
        handlerType,
    });
}

const serverFnRequest = (headers: Record<string, string>) =>
    new Request("http://localhost:3001/_serverFn/probe", {
        method: "POST",
        headers: { host: "localhost:3001", ...headers },
    });

describe("global request middleware", () => {
    it("passes a same-origin server function request", async () => {
        const result = (await runPipeline(
            serverFnRequest({ "sec-fetch-site": "same-origin" }),
            "serverFn",
        )) as { response: Response };

        expect(result.response.status).toBe(200);
    });

    it("rejects a cross-site server function request with no Origin with 403", async () => {
        const result = await runPipeline(
            serverFnRequest({ "sec-fetch-site": "cross-site" }),
            "serverFn",
        );

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(403);
    });

    it("does not consume the request body on its way to a POST handler", async () => {
        const request = new Request("http://localhost:3001/_serverFn/probe", {
            method: "POST",
            headers: {
                host: "localhost:3001",
                "sec-fetch-site": "same-origin",
                "content-type": "application/json",
            },
            body: JSON.stringify({ entry: { tenantId: "tenant-1" } }),
        });

        await runPipeline(request, "router");

        // A previous version called applyTenantToRequest() here; its
        // `new Request(request, { headers })` stole the body stream, so every
        // BFF POST received `bodyUsed: true` and request.json() returned null.
        expect(request.bodyUsed).toBe(false);
        expect(await request.json()).toEqual({
            entry: { tenantId: "tenant-1" },
        });
    });

    it("returns the Task 3-injected tenant slug from getTenantContext()", async () => {
        const request = new Request("http://acme.nip.io/_serverFn/probe", {
            headers: {
                host: "acme.nip.io",
                "sec-fetch-site": "same-origin",
            },
        });
        const result = (await runPipeline(request, "serverFn")) as {
            response: Response;
        };

        expect(result.response.status).toBe(200);
        expect(await result.response.json()).toMatchObject({
            slug: "acme",
            moduleType: "store",
            tenantId: "tenant-uuid-1",
        });
    });
});
