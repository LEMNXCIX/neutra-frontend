/**
 * Tenant resolution in the Next.js proxy.
 *
 * The regression these guard: when the backend could not resolve a tenant
 * subdomain, the proxy guessed a module type from the slug text
 * (`includes('book')` -> booking, anything else -> store). A typo, or a wrong
 * name on a device, then served a real storefront under another tenant's
 * identity. There is no guess now: an unknown name is 404 and an unreachable
 * backend is 503.
 *
 * The tenant headers travel on the outgoing request that NextResponse.next and
 * NextResponse.rewrite are given, not on the response, so next/server is mocked
 * to record them. Each case uses a distinct slug because resolved configs are
 * cached in a module-level map for 60s.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
    captured: [] as Array<{ kind: string; url?: string; headers: Headers }>,
}));

vi.mock("next/server", () => {
    const record = (
        kind: string,
        url: string | undefined,
        init: { request?: { headers?: Headers } } | undefined,
    ) => {
        const headers = new Headers(init?.request?.headers);
        h.captured.push({ kind, url, headers });
        const res = new NextResponseMock(null, { status: 200, headers });
        return res;
    };

    // NextResponse is used both as a constructor (for the error responses the
    // proxy returns) and via its static next()/rewrite() helpers.
    class NextResponseMock extends Response {
        // The proxy writes the tenant context back as cookies on the response.
        cookies = { set: () => {}, get: () => undefined, getAll: () => [] };
        static next(init?: { request?: { headers?: Headers } }) {
            return record("next", undefined, init);
        }
        static rewrite(url: URL, init?: { request?: { headers?: Headers } }) {
            return record("rewrite", String(url), init);
        }
    }

    return { NextResponse: NextResponseMock };
});

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { proxy } from "@/proxy";

const makeRequest = (host: string) =>
    ({
        headers: new Headers({ host }),
        nextUrl: new URL(`http://${host}/`),
    }) as never;

const lastCall = () => h.captured[h.captured.length - 1];
const tenantResponse = (type: string) => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { type, id: "tenant-uuid-1" } }),
});

beforeEach(() => {
    vi.clearAllMocks();
    h.captured.length = 0;
    vi.stubEnv("BACKEND_API_URL", "http://localhost:4000/api");
});

describe("proxy tenant resolution", () => {
    it("routes a store tenant and forwards its slug and module type", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        await proxy(makeRequest("shop.localhost:3001"));

        expect(lastCall().headers.get("x-tenant-slug")).toBe("shop");
        expect(lastCall().headers.get("x-module-type")).toBe("store");
    });

    it("rewrites the root of a store tenant to /store", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        await proxy(makeRequest("boutique.localhost:3001"));

        expect(lastCall().kind).toBe("rewrite");
        expect(lastCall().url).toContain("/store");
    });

    it("routes a booking tenant to /home", async () => {
        mockFetch.mockResolvedValue(tenantResponse("BOOKING"));

        await proxy(makeRequest("salon.localhost:3001"));

        expect(lastCall().headers.get("x-module-type")).toBe("booking");
        expect(lastCall().url).toContain("/home");
    });

    it("forwards the tenant id alongside the slug", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        await proxy(makeRequest("ferreteria.localhost:3001"));

        expect(lastCall().headers.get("x-tenant-id")).toBe("tenant-uuid-1");
    });

    it("returns 404 for a tenant the backend does not know, without guessing", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}),
        });

        const res = await proxy(makeRequest("typo.localhost:3001"));

        expect(res.status).toBe(404);
        expect(res.headers.get("x-tenant-lookup")).toBe("not_found");
        // Nothing was rendered: no guessed module type reached a page.
        expect(h.captured).toHaveLength(0);
    });

    it("returns 503 when the backend cannot be reached, without guessing", async () => {
        mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

        const res = await proxy(makeRequest("outage.localhost:3001"));

        expect(res.status).toBe(503);
        expect(res.headers.get("x-tenant-lookup")).toBe("unavailable");
        expect(h.captured).toHaveLength(0);
    });

    it("returns 503 when the backend answers with an unusable payload", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: false }),
        });

        const res = await proxy(makeRequest("garbage.localhost:3001"));

        expect(res.status).toBe(503);
    });

    it("treats the bare host as superadmin without consulting the backend", async () => {
        await proxy(makeRequest("localhost:3001"));

        expect(lastCall().headers.get("x-tenant-slug")).toBe("superadmin");
        expect(lastCall().headers.get("x-module-type")).toBe("root");
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("resolves a nip.io tenant host from the subdomain", async () => {
        mockFetch.mockResolvedValue(tenantResponse("BOOKING"));

        await proxy(makeRequest("clinica.192.168.68.100.nip.io:3001"));

        expect(lastCall().headers.get("x-tenant-slug")).toBe("clinica");
        expect(lastCall().headers.get("x-module-type")).toBe("booking");
    });

    it("ignores the port when identifying the tenant", async () => {
        mockFetch.mockResolvedValue(tenantResponse("STORE"));

        await proxy(makeRequest("tienda.localhost:3002"));

        expect(lastCall().headers.get("x-tenant-slug")).toBe("tienda");
    });

    it("reserves the www host for superadmin", async () => {
        await proxy(makeRequest("www.neunetra.com"));

        expect(lastCall().headers.get("x-tenant-slug")).toBe("superadmin");
        expect(mockFetch).not.toHaveBeenCalled();
    });
});
