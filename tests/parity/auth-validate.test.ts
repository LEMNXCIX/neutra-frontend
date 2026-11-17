/**
 * Re-port of the deleted `src/app/api/auth/__tests__/validate.test.ts` against
 * the Web handler shipped by Task 6 (`webBffHandlers["GET /api/auth/validate"]`,
 * reached through the generated Start route). No `next/server` mocks: the token
 * is extracted from a real Web `Request` and only `backendGet` is stubbed.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    backendGet: vi.fn(),
}));

vi.mock("@/lib/backend-api", () => ({
    backendGet: mocks.backendGet,
    backendFetch: vi.fn(),
    backendPut: vi.fn(),
    backendPost: vi.fn(),
    backendDelete: vi.fn(),
    serverBackendFetch: vi.fn(),
}));

import { Route as ValidateRoute } from "@/routes/api/auth/validate/route";

type Handler = (ctx: {
    request: Request;
    params?: Record<string, string>;
}) => Promise<Response>;

function getHandler(route: { options: unknown }): Handler {
    const server = (
        route.options as { server?: { handlers: Record<string, Handler> } }
    ).server;
    const handler = server?.handlers?.GET;
    if (typeof handler !== "function") {
        throw new Error("No GET handler on /api/auth/validate route");
    }
    return handler;
}

function request(headers: Record<string, string> = {}): Request {
    return new Request("http://tenant.local/api/auth/validate", { headers });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/auth/validate (Web handler)", () => {
    it("returns 401 when no token is found and never calls the backend", async () => {
        const response = await getHandler(ValidateRoute)({
            request: request(),
        });
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.message).toBe("No se encontró un token de sesión");
        expect(mocks.backendGet).not.toHaveBeenCalled();
    });

    it("returns user data when validation succeeds with a bearer token", async () => {
        mocks.backendGet.mockResolvedValueOnce({
            success: true,
            data: { user: { id: "1", name: "Test User" } },
            statusCode: 200,
        });

        const response = await getHandler(ValidateRoute)({
            request: request({ authorization: "Bearer valid-token" }),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.user.id).toBe("1");
        expect(mocks.backendGet).toHaveBeenCalledWith(
            "/auth/validate",
            "valid-token",
        );
    });

    it("falls back to /auth/me when /auth/validate returns 404", async () => {
        mocks.backendGet
            .mockResolvedValueOnce({
                success: false,
                statusCode: 404,
                data: null,
            })
            .mockResolvedValueOnce({
                success: true,
                data: { id: "1", name: "User from /me" },
                statusCode: 200,
            });

        const response = await getHandler(ValidateRoute)({
            request: request({ authorization: "Bearer valid-token" }),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mocks.backendGet).toHaveBeenCalledTimes(2);
        expect(mocks.backendGet).toHaveBeenNthCalledWith(
            1,
            "/auth/validate",
            "valid-token",
        );
        expect(mocks.backendGet).toHaveBeenNthCalledWith(
            2,
            "/auth/me",
            "valid-token",
        );
        expect(body.user).toEqual({ id: "1", name: "User from /me" });
    });

    it("returns the fallback error when /auth/me also fails", async () => {
        mocks.backendGet
            .mockResolvedValueOnce({
                success: false,
                statusCode: 404,
                data: null,
            })
            .mockResolvedValueOnce({
                success: false,
                statusCode: 401,
                data: null,
                message: "Invalid token",
            });

        const response = await getHandler(ValidateRoute)({
            request: request({ authorization: "Bearer valid-token" }),
        });
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
    });

    it("returns 500 with the failure when the backend throws", async () => {
        mocks.backendGet.mockRejectedValueOnce(new Error("Connection refused"));

        const response = await getHandler(ValidateRoute)({
            request: request({ authorization: "Bearer valid-token" }),
        });
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error).toBe("Connection refused");
    });

    it("extracts the token from the request cookie header", async () => {
        mocks.backendGet.mockResolvedValueOnce({
            success: true,
            data: { user: { id: "1" } },
            statusCode: 200,
        });

        const response = await getHandler(ValidateRoute)({
            request: request({ cookie: "token=token-from-cookie" }),
        });

        expect(response.status).toBe(200);
        expect(mocks.backendGet).toHaveBeenCalledWith(
            "/auth/validate",
            "token-from-cookie",
        );
    });
});
