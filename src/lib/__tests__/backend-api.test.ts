/**
 * Contract tests for the backend client.
 *
 * The regression these guard: backendFetch used to rebuild the Cookie header as
 * `token=<jwt>` alone, silently dropping every other cookie in the caller's jar.
 * That is what made the admin logout path get rejected before it reached the
 * backend. The jar is now forwarded untouched.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHeaders = vi.fn();

vi.mock("next/headers", () => ({
    headers: () => mockHeaders(),
}));

import { backendFetch } from "@/lib/backend-api";

const okResponse = (body: unknown = { success: true, data: { id: "1" } }) => ({
    status: 200,
    ok: true,
    statusText: "OK",
    json: async () => body,
});

const requestHeadersOf = (): Record<string, string> => {
    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    return init.headers as Record<string, string>;
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BACKEND_API_URL", "http://localhost:4001/api");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
    mockHeaders.mockResolvedValue(new Headers());
});

describe("backendFetch cookie contract", () => {
    it("forwards the whole incoming cookie jar, not just the token", async () => {
        mockHeaders.mockResolvedValue(
            new Headers({
                cookie: "token=jwt-value; tenant-slug=default; refresh=abc",
            }),
        );

        await backendFetch("/auth/logout", {
            method: "POST",
            token: "jwt-value",
        });

        expect(requestHeadersOf().Cookie).toBe(
            "token=jwt-value; tenant-slug=default; refresh=abc",
        );
    });

    it("does not warn when a jar was available", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        mockHeaders.mockResolvedValue(
            new Headers({ cookie: "token=jwt-value" }),
        );

        await backendFetch("/auth/logout", {
            method: "POST",
            token: "jwt-value",
        });

        expect(warn).not.toHaveBeenCalled();
    });

    it("falls back to a token-only Cookie and says so when no jar exists", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        await backendFetch("/auth/logout", {
            method: "POST",
            token: "jwt-value",
        });

        expect(requestHeadersOf().Cookie).toBe("token=jwt-value");
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining("No incoming cookie jar"),
        );
    });

    it("omits Cookie entirely when there is neither a jar nor a token", async () => {
        await backendFetch("/products");

        expect(requestHeadersOf().Cookie).toBeUndefined();
    });

    it("never puts a credential in a log line", async () => {
        const log = vi.spyOn(console, "log").mockImplementation(() => {});
        vi.stubEnv("LOG_HEADERS", "true");
        mockHeaders.mockResolvedValue(
            new Headers({ cookie: "token=super-secret-jwt" }),
        );

        await backendFetch("/products");

        const logged = log.mock.calls
            .map((call) => JSON.stringify(call))
            .join("\n");
        expect(logged).not.toContain("super-secret-jwt");
        expect(logged).toContain("[redacted]");
    });
});

describe("backendFetch tenant contract", () => {
    it("forwards x-tenant-slug and x-tenant-id from the request context", async () => {
        mockHeaders.mockResolvedValue(
            new Headers({
                "x-tenant-slug": "booking1",
                "x-tenant-id": "tenant-uuid-1",
            }),
        );

        await backendFetch("/appointments");

        const headers = requestHeadersOf();
        expect(headers["x-tenant-slug"]).toBe("booking1");
        expect(headers["x-tenant-id"]).toBe("tenant-uuid-1");
    });

    it("drops the default tenant id so it cannot override the resolved slug", async () => {
        vi.stubEnv(
            "NEXT_PUBLIC_DEFAULT_TENANT",
            "default-tenant-00000000-0000-0000-0000-000000000001",
        );
        mockHeaders.mockResolvedValue(
            new Headers({
                "x-tenant-slug": "booking1",
                "x-tenant-id":
                    "default-tenant-00000000-0000-0000-0000-000000000001",
            }),
        );

        await backendFetch("/appointments");

        const headers = requestHeadersOf();
        expect(headers["x-tenant-slug"]).toBe("booking1");
        expect(headers["x-tenant-id"]).toBeUndefined();
    });
});

describe("backendFetch url contract", () => {
    it("resolves through BACKEND_API_URL and appends the endpoint", async () => {
        await backendFetch("/products");

        expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
            "http://localhost:4001/api/products",
        );
    });

    it("does not duplicate the /api segment", async () => {
        vi.stubEnv("BACKEND_API_URL", "http://localhost:4001/api");
        await backendFetch("/products");
        expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
            "http://localhost:4001/api/products",
        );
    });

    it("surfaces a missing BACKEND_API_URL instead of calling a guessed host", async () => {
        vi.stubEnv("BACKEND_API_URL", "");

        await expect(backendFetch("/products")).rejects.toThrow(
            /BACKEND_API_URL is not set/,
        );
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe("backendFetch original origin contract", () => {
    it("forwards x-original-origin from the Origin header", async () => {
        mockHeaders.mockResolvedValue(
            new Headers({ origin: "https://booking1.neunetra.com" }),
        );

        await backendFetch("/appointments");

        expect(requestHeadersOf()["x-original-origin"]).toBe(
            "https://booking1.neunetra.com",
        );
    });

    it("falls back to the referer origin when Origin is absent", async () => {
        mockHeaders.mockResolvedValue(
            new Headers({
                referer: "https://default.neunetra.com/store?page=2",
            }),
        );

        await backendFetch("/services");

        expect(requestHeadersOf()["x-original-origin"]).toBe(
            "https://default.neunetra.com",
        );
    });

    it("reconstructs from host and forwarded proto when both are absent", async () => {
        mockHeaders.mockResolvedValue(
            new Headers({
                host: "booking1.localhost:3001",
                "x-forwarded-proto": "https",
            }),
        );

        await backendFetch("/services");

        expect(requestHeadersOf()["x-original-origin"]).toBe(
            "https://booking1.localhost:3001",
        );
    });

    it("omits the header when the request carries no host information", async () => {
        mockHeaders.mockResolvedValue(new Headers());

        await backendFetch("/services");

        expect(requestHeadersOf()["x-original-origin"]).toBeUndefined();
    });
});
