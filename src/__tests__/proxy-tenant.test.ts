/**
 * Tenant resolution in the proxy contract.
 *
 * The regression these guard: when the backend could not resolve a tenant
 * subdomain, the proxy guessed a module type from the slug text
 * (`includes('book')` -> booking, anything else -> store). A typo, or a wrong
 * name on a device, then served a real storefront under another tenant's
 * identity. There is no guess now: an unknown name is 404 and an unreachable
 * backend is 503.
 *
 * The rules are shared with the live server entry; `resolveProxy` exposes the
 * outgoing request headers and the rewrite target so they can be asserted
 * without a Next middleware adapter. Each case uses a distinct slug because
 * resolved configs are cached in a module-level map for 60s.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { resolveProxy } from "@/proxy";

const makeRequest = (host: string) =>
    new Request(`http://${host}/`, { headers: { host } });

const tenantResponse = (type: string) => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { type, id: "tenant-uuid-1" } }),
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BACKEND_API_URL", "http://localhost:4000/api");
});

describe("proxy tenant resolution", () => {
    it("routes a store tenant and forwards its slug and module type", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        const outcome = await resolveProxy(makeRequest("shop.localhost:3001"));

        expect(outcome.headers.get("x-tenant-slug")).toBe("shop");
        expect(outcome.headers.get("x-module-type")).toBe("store");
    });

    it("rewrites the root of a store tenant to /store", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        const outcome = await resolveProxy(
            makeRequest("boutique.localhost:3001"),
        );

        expect(outcome.kind).toBe("rewrite");
        expect(outcome.url).toContain("/store");
    });

    it("routes a booking tenant to /home", async () => {
        mockFetch.mockResolvedValue(tenantResponse("BOOKING"));

        const outcome = await resolveProxy(makeRequest("salon.localhost:3001"));

        expect(outcome.headers.get("x-module-type")).toBe("booking");
        expect(outcome.url).toContain("/home");
    });

    it("forwards the tenant id alongside the slug", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        const outcome = await resolveProxy(
            makeRequest("ferreteria.localhost:3001"),
        );

        expect(outcome.headers.get("x-tenant-id")).toBe("tenant-uuid-1");
    });

    it("returns 404 for a tenant the backend does not know, without guessing", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}),
        });

        const outcome = await resolveProxy(makeRequest("typo.localhost:3001"));

        expect(outcome.kind).toBe("error");
        expect(outcome.response.status).toBe(404);
        expect(outcome.response.headers.get("x-tenant-lookup")).toBe(
            "not_found",
        );
        expect(outcome.headers.get("x-module-type")).toBeNull();
    });

    it("returns 503 when the backend cannot be reached, without guessing", async () => {
        mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

        const outcome = await resolveProxy(
            makeRequest("outage.localhost:3001"),
        );

        expect(outcome.kind).toBe("error");
        expect(outcome.response.status).toBe(503);
        expect(outcome.response.headers.get("x-tenant-lookup")).toBe(
            "unavailable",
        );
        expect(outcome.headers.get("x-module-type")).toBeNull();
    });

    it("returns 503 when the backend answers with an unusable payload", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: false }),
        });

        const outcome = await resolveProxy(
            makeRequest("garbage.localhost:3001"),
        );

        expect(outcome.response.status).toBe(503);
    });

    it("treats the bare host as superadmin without consulting the backend", async () => {
        const outcome = await resolveProxy(makeRequest("localhost:3001"));

        expect(outcome.headers.get("x-tenant-slug")).toBe("superadmin");
        expect(outcome.headers.get("x-module-type")).toBe("root");
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("resolves a nip.io tenant host from the subdomain", async () => {
        mockFetch.mockResolvedValue(tenantResponse("BOOKING"));

        const outcome = await resolveProxy(
            makeRequest("clinica.192.168.68.100.nip.io:3001"),
        );

        expect(outcome.headers.get("x-tenant-slug")).toBe("clinica");
        expect(outcome.headers.get("x-module-type")).toBe("booking");
    });

    it("ignores the port when identifying the tenant", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        const outcome = await resolveProxy(
            makeRequest("tienda.localhost:3002"),
        );

        expect(outcome.headers.get("x-tenant-slug")).toBe("tienda");
    });

    it("reserves the www host for superadmin", async () => {
        const outcome = await resolveProxy(makeRequest("www.neunetra.com"));

        expect(outcome.headers.get("x-tenant-slug")).toBe("superadmin");
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns a Web Response from the proxy entry point", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        const { proxy } = await import("@/proxy");
        const response = await proxy(makeRequest("web.localhost:3001"));

        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(200);
        expect(response.headers.get("set-cookie")).toContain("tenant-slug");
    });
});
