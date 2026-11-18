/**
 * Wire-contract checks for the three BFF endpoints the rewrite must preserve.
 *
 * Real parity fixtures still need a live capture, so these drive the handlers
 * with deterministic backend mocks. The assertions target the stable part of
 * the contract: status, `success`, `errors[].code` and `meta.traceId` presence.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    serverBackendFetch: vi.fn(),
    backendGet: vi.fn(),
    backendPut: vi.fn(),
    backendFetch: vi.fn(),
    getBackendUrl: vi.fn(() => "http://backend.test/api"),
    fetch: vi.fn(),
}));

vi.mock("@/lib/backend-api", () => ({
    serverBackendFetch: mocks.serverBackendFetch,
    backendGet: mocks.backendGet,
    backendPut: mocks.backendPut,
    backendFetch: mocks.backendFetch,
    backendPost: vi.fn(),
    backendDelete: vi.fn(),
}));

vi.mock("@/lib/backend-url", () => ({ getBackendUrl: mocks.getBackendUrl }));

import { Route as AdminProductsRoute } from "@/routes/api/admin/products/route";
import { Route as LoginRoute } from "@/routes/api/auth/login/route";
import { Route as OrdersRoute } from "@/routes/api/orders/route";
import { Route as ProductsRoute } from "@/routes/api/products/route";

type Handler = (ctx: {
    request: Request;
    params?: Record<string, string>;
}) => Promise<Response>;

function handlerFor(route: { options: unknown }, method: string) {
    const server = (
        route.options as { server?: { handlers: Record<string, Handler> } }
    ).server;
    const handler = server?.handlers?.[method];
    if (typeof handler !== "function") {
        throw new Error(`No ${method} handler on route`);
    }
    return handler;
}

const envelope = (
    traceId: string,
    overrides: Record<string, unknown> = {},
) => ({
    success: true,
    statusCode: 200,
    message: "ok",
    data: [],
    meta: { traceId, timestamp: "2026-01-01T00:00:00.000Z" },
    ...overrides,
});

function backendEnvelopeError(
    traceId: string,
    code: string,
    statusCode: number,
): Error {
    return Object.assign(new Error(code), {
        statusCode,
        response: {
            success: false,
            statusCode,
            message: code,
            errors: [{ code, message: code }],
            meta: { traceId, timestamp: "2026-01-01T00:00:00.000Z" },
        },
    });
}

function jsonResponse(
    body: unknown,
    status: number,
    setCookies: string[] = [],
): Response {
    const headers = new Headers({ "content-type": "application/json" });
    for (const cookie of setCookies) headers.append("set-cookie", cookie);
    return new Response(JSON.stringify(body), { status, headers });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("/api/products contract", () => {
    it("forwards a successful backend envelope verbatim", async () => {
        mocks.serverBackendFetch.mockResolvedValue(
            envelope("trace-products", {
                data: [{ id: "p1" }],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            }),
        );

        const response = await handlerFor(
            ProductsRoute,
            "GET",
        )({
            request: new Request("http://tenant.local/api/products"),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.meta.traceId).toBe("trace-products");
        expect(body.pagination).toEqual({
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
        });
    });

    it("forwards status, error codes and trace id from a backend failure", async () => {
        mocks.serverBackendFetch.mockRejectedValue(
            backendEnvelopeError("trace-products-err", "EMAIL_TAKEN", 409),
        );

        const response = await handlerFor(
            ProductsRoute,
            "POST",
        )({
            request: new Request("http://tenant.local/api/products", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name: "dup" }),
            }),
        });
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.success).toBe(false);
        expect(body.errors?.[0]?.code).toBe("EMAIL_TAKEN");
        expect(body.meta.traceId).toBe("trace-products-err");
    });
});

describe("/api/auth/login contract", () => {
    it("keeps every Set-Cookie and the backend envelope on success", async () => {
        mocks.fetch.mockResolvedValue(
            jsonResponse(
                envelope("trace-login", { data: { user: { id: "u1" } } }),
                200,
                ["token=a; Path=/", "refresh=b; Path=/"],
            ),
        );

        const response = await handlerFor(
            LoginRoute,
            "POST",
        )({
            request: new Request("http://tenant.local/api/auth/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: "a@b.c", password: "x" }),
            }),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.meta.traceId).toBe("trace-login");
        expect(response.headers.getSetCookie()).toEqual([
            "token=a; Path=/",
            "refresh=b; Path=/",
        ]);
    });

    it("forwards the backend error code and trace id on failure", async () => {
        mocks.fetch.mockResolvedValue(
            jsonResponse(
                {
                    success: false,
                    statusCode: 401,
                    message: "INVALID_CREDENTIALS",
                    errors: [{ code: "INVALID_CREDENTIALS", message: "bad" }],
                    meta: {
                        traceId: "trace-login-err",
                        timestamp: "2026-01-01T00:00:00.000Z",
                    },
                },
                401,
            ),
        );

        const response = await handlerFor(
            LoginRoute,
            "POST",
        )({
            request: new Request("http://tenant.local/api/auth/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: "a@b.c", password: "bad" }),
            }),
        });
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.errors?.[0]?.code).toBe("INVALID_CREDENTIALS");
        expect(body.meta.traceId).toBe("trace-login-err");
    });
});

describe("/api/admin/products list+stats contract", () => {
    it("normalises legacy pagination to {total,page,limit,totalPages}", async () => {
        mocks.serverBackendFetch
            .mockResolvedValueOnce(
                envelope("trace-admin-products", {
                    data: [{ id: "p1" }],
                    pagination: {
                        currentPage: 2,
                        totalPages: 5,
                        totalItems: 42,
                        itemsPerPage: 10,
                    },
                }),
            )
            .mockResolvedValueOnce(
                envelope("trace-admin-stats", {
                    data: { totalProducts: 42 },
                }),
            );

        const response = await handlerFor(
            AdminProductsRoute,
            "GET",
        )({
            request: new Request("http://tenant.local/api/admin/products"),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(typeof body.meta.traceId).toBe("string");
        expect(body.meta.traceId.length).toBeGreaterThan(0);
        expect(body.pagination).toEqual({
            total: 42,
            page: 2,
            limit: 10,
            totalPages: 5,
        });
    });
});

describe("/api/orders contract", () => {
    it("passes through the backend success status and trace id", async () => {
        mocks.serverBackendFetch.mockResolvedValue(
            envelope("trace-orders", { statusCode: 202 }),
        );

        const response = await handlerFor(
            OrdersRoute,
            "GET",
        )({
            request: new Request("http://tenant.local/api/orders"),
        });
        const body = await response.json();

        expect(response.status).toBe(202);
        expect(body.success).toBe(true);
        expect(body.meta.traceId).toBe("trace-orders");
    });

    it("returns a body-less 204 when the backend has no content", async () => {
        mocks.serverBackendFetch.mockResolvedValue(null);

        const response = await handlerFor(
            OrdersRoute,
            "GET",
        )({
            request: new Request("http://tenant.local/api/orders"),
        });

        expect(response.status).toBe(204);
        expect(await response.text()).toBe("");
    });
});
