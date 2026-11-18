/**
 * BFF contract tests — Web `Request`/`Response` + Start server utilities.
 *
 * These drive the real `createBffHandler` / `serverBackendFetch` against a stubbed
 * global `fetch`, so the assertions cover the whole contract: the envelope is
 * forwarded untouched, the backend HTTP status is not rewritten, `errors[]`
 * survives, 204 has no body, and proxy-injected tenant headers beat cookies.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

/** The Start request context that `serverBackendFetch` reads. */
const ctx = vi.hoisted(() => ({
    headers: new Headers() as Headers,
}));

vi.mock("@tanstack/react-start/server", () => ({
    getRequest: () => ({ headers: ctx.headers }),
    getRequestHeader: (name: string) => ctx.headers.get(name) ?? undefined,
    getCookie: (name: string) => {
        const jar = ctx.headers.get("cookie") ?? "";
        for (const pair of jar.split(";")) {
            const [key, ...value] = pair.trim().split("=");
            if (key === name) return decodeURIComponent(value.join("="));
        }
        return undefined;
    },
}));

import {
    createBffHandler,
    createGetHandler,
    createPostHandler,
    createRouteHandler,
} from "@/lib/api-route-handler";
import { serverBackendFetch } from "@/lib/backend-api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const OK = (data: unknown = { id: "1" }) => ({
    success: true,
    statusCode: 200,
    message: "OK",
    data,
    meta: { traceId: "trace-ok", timestamp: "2024-01-01T00:00:00.000Z" },
});

const backendResponse = (body: unknown, status = 200, ok = true) => ({
    status,
    ok,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
});

const makeReq = (url: string, init: RequestInit = {}) =>
    new Request(url, {
        ...init,
        headers: { authorization: "Bearer tok-123", ...(init.headers ?? {}) },
    });

const fetchInitOf = (call = 0): RequestInit =>
    mockFetch.mock.calls[call][1] as RequestInit;
const fetchHeadersOf = (call = 0): Record<string, string> =>
    fetchInitOf(call).headers as Record<string, string>;

beforeEach(() => {
    vi.clearAllMocks();
    ctx.headers = new Headers();
    vi.stubEnv("BACKEND_API_URL", "http://localhost:4001/api");
    vi.stubEnv("LOG_HEADERS", "");
    mockFetch.mockResolvedValue(backendResponse(OK()));
});

describe("createBffHandler", () => {
    it("GET: forwards token and passes backend envelope through with 200", async () => {
        const handler = createBffHandler("GET", "/products");
        const res = await handler({
            request: makeReq("http://localhost/api/products?page=2"),
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/products?page=2"),
            expect.objectContaining({ method: "GET" }),
        );
        expect(fetchHeadersOf().Cookie).toBe("token=tok-123");
        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ success: true });
    });

    it("GET: appends query params to the endpoint by default", async () => {
        const handler = createBffHandler("GET", "/products");
        await handler({
            request: makeReq("http://localhost/api/products?page=2&limit=5"),
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/products?page=2&limit=5"),
            expect.anything(),
        );
    });

    it("GET: function resolvers receive request params", async () => {
        const handler = createBffHandler(
            "GET",
            (_req, params) => `/items/${params?.id}`,
        );
        await handler({
            request: makeReq("http://localhost/api/items/7"),
            params: { id: "7" },
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/items/7"),
            expect.anything(),
        );
    });

    it("POST: parses the body and returns 201 by default", async () => {
        const handler = createBffHandler("POST", "/products");
        const res = await handler({
            request: makeReq("http://localhost/api/products", {
                method: "POST",
                body: JSON.stringify({ name: "X" }),
            }),
        });

        expect(fetchInitOf()).toMatchObject({
            method: "POST",
            body: JSON.stringify({ name: "X" }),
        });
        expect(res.status).toBe(201);
    });

    it("PUT: propagates backend statusCode on failure", async () => {
        mockFetch.mockResolvedValue(
            backendResponse(
                {
                    success: false,
                    statusCode: 422,
                    message: "Invalid data",
                    errors: [
                        { code: "VALIDATION_INVALID_FORMAT", message: "bad" },
                    ],
                },
                422,
                false,
            ),
        );
        const handler = createBffHandler("PUT", "/products/1");
        const res = await handler({
            request: makeReq("http://localhost/api/products/1", {
                method: "PUT",
                body: JSON.stringify({ price: -1 }),
            }),
        });

        expect(res.status).toBe(422);
        expect(await res.json()).toMatchObject({
            success: false,
            message: "Invalid data",
        });
    });

    it("returns 500 with traceId when the backend call throws", async () => {
        mockFetch.mockRejectedValue(new Error("backend down"));
        const handler = createBffHandler("GET", "/products");
        const res = await handler({
            request: makeReq("http://localhost/api/products"),
        });

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.success).toBe(false);
        expect(body.message).toBe("backend down");
        expect(body.meta?.traceId ?? body.traceId).toBeDefined();
    });

    it("successStatus can be overridden via config", async () => {
        const handler = createBffHandler("POST", "/custom", {
            successStatus: 204,
        });
        const res = await handler({
            request: makeReq("http://localhost/api/custom", {
                method: "POST",
                body: "{}",
            }),
        });
        expect(res.status).toBe(204);
        expect(await res.text()).toBe("");
    });
});

describe("createBffHandler passThroughStatus", () => {
    it("forwards the backend status instead of the declared default", async () => {
        mockFetch.mockResolvedValue(
            backendResponse({ success: true, statusCode: 202, data: {} }, 202),
        );
        const handler = createBffHandler("POST", "/orders", {
            successStatus: 201,
            passThroughStatus: true,
        });

        const res = await handler({
            request: makeReq("http://localhost/api/orders"),
        });

        expect(res.status).toBe(202);
    });

    it("returns a body-less response for a backend 204", async () => {
        const jsonSpy = vi.fn();
        mockFetch.mockResolvedValue({
            status: 204,
            ok: true,
            json: jsonSpy,
        });
        const handler = createBffHandler(
            "DELETE",
            (_req, params) => `/products/${params?.id}`,
        );
        // A 204 must not be parsed even when the declared status is forwarded.
        const res = await handler({
            request: makeReq("http://localhost/api/products/7"),
            params: { id: "7" },
        });

        expect(res.status).toBe(204);
        expect(await res.text()).toBe("");
        expect(jsonSpy).not.toHaveBeenCalled();
    });

    it("still uses the declared status when passThroughStatus is off", async () => {
        mockFetch.mockResolvedValue(
            backendResponse({ success: true, statusCode: 202, data: {} }, 202),
        );
        const handler = createPostHandler("/orders");

        const res = await handler(makeReq("http://localhost/api/orders"));

        expect(res.status).toBe(201);
    });
});

describe("createBffHandler forwards the backend error contract", () => {
    it("keeps errors[] and the backend traceId so the client can translate the code", async () => {
        // The shape the backend actually returns: the code is the only stable
        // part of the contract, the message is English prose.
        const envelope = {
            success: false,
            statusCode: 422,
            message: "A campaign can be archived only at or after claimUntil",
            errors: [
                {
                    code: "LOYALTY_CAMPAIGN_ARCHIVE_TOO_EARLY",
                    message:
                        "A campaign can be archived only at or after claimUntil",
                },
            ],
            meta: { traceId: "backend-trace-1", timestamp: "2024-01-01" },
        };
        mockFetch.mockResolvedValue(backendResponse(envelope, 422, false));

        const handler = createPostHandler("/loyalty/campaigns/:id/archive");
        const res = await handler(makeReq("http://localhost/api/archive"), {
            params: Promise.resolve({ id: "c1" }),
        });

        expect(res.status).toBe(422);
        const body = await res.json();
        expect(body.errors).toEqual(envelope.errors);
        expect(body.meta.traceId).toBe("backend-trace-1");
    });

    it("sends an empty errors array when the backend sent none", async () => {
        mockFetch.mockRejectedValue(
            Object.assign(new Error("boom"), { statusCode: 500 }),
        );

        const handler = createGetHandler("/loyalty/campaigns");
        const res = await handler(makeReq("http://localhost/api/loyalty"));
        const body = await res.json();

        // Present-but-empty, never absent: the client reads errors[].code and a
        // missing key reads as a different failure than an empty list.
        expect(body.errors).toEqual([]);
    });
});

describe("serverBackendFetch contract", () => {
    it("returns null for 204 without parsing a body", async () => {
        const jsonSpy = vi.fn();
        mockFetch.mockResolvedValueOnce({
            status: 204,
            ok: true,
            json: jsonSpy,
        });

        await expect(serverBackendFetch("/products")).resolves.toBeNull();
        expect(jsonSpy).not.toHaveBeenCalled();
    });

    it("uses x-tenant-slug header over tenant-slug cookie when forwarding", async () => {
        ctx.headers = new Headers({
            cookie: "token=jwt-value; tenant-slug=stale; tenant-id=cookie-tenant",
            "x-tenant-slug": "acme",
            "x-tenant-id": "header-tenant",
        });

        await serverBackendFetch("/products");

        const headers = fetchHeadersOf();
        expect(headers["x-tenant-slug"]).toBe("acme");
        expect(headers["x-tenant-id"]).toBe("header-tenant");
        // The whole jar is still forwarded to the backend.
        expect(headers.Cookie).toContain("tenant-slug=stale");
    });
});

describe("legacy route-handler adapters", () => {
    it("createRouteHandler still adapts a Next-style (request, context) call", async () => {
        const handler = createRouteHandler({
            method: "GET",
            endpoint: (_req, params) => `/roles/${params?.id}`,
        });
        const res = await handler(makeReq("http://localhost/api/roles/7"), {
            params: Promise.resolve({ id: "7" }),
        });

        expect(res.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/roles/7"),
            expect.anything(),
        );
    });
});
