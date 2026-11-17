/**
 * Strapi publish webhook: the HTTP contract stays byte-for-byte compatible,
 * but the handler now performs real cache invalidation instead of only logging.
 *
 * RED (Task 14): the current handler logs `content:<tenant>` and strapi.ts uses
 * a bare `fetch`, so caching and invalidation assertions fail. GREEN: a tagged
 * server cache plus a TanStack Query invalidation bridge make the second read
 * refetch after the webhook.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    getRequestHeader: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({
    getRequestHeader: mocks.getRequestHeader,
    getRequest: () => undefined,
    getCookie: () => undefined,
}));

import { webBffHandlers } from "@/lib/api-route-handler";
import { clearContentCache, contentCacheSize } from "@/lib/content-cache";
import { registerQueryClient } from "@/lib/query-invalidation";
import { strapiFindOneByTenant } from "@/lib/strapi";

const handler = webBffHandlers["POST /api/revalidate"];

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

function revalidate(
    body: unknown,
    headers: Record<string, string> = {},
): Promise<Response> {
    return handler({
        request: new Request("http://tenant.local/api/revalidate", {
            method: "POST",
            headers: { "content-type": "application/json", ...headers },
            body: JSON.stringify(body),
        }),
    });
}

beforeEach(() => {
    clearContentCache();
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.fetch.mockReset();
    mocks.getRequestHeader.mockReset();
    // A Response body can only be consumed once, so each call needs a fresh one.
    mocks.fetch.mockImplementation(() =>
        Promise.resolve(
            jsonResponse({ data: [{ id: "entry-1", title: "Home" }] }),
        ),
    );
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("Strapi tagged content cache", () => {
    it("serves a second read of the same tenant content from cache", async () => {
        const first = await strapiFindOneByTenant("home-contents", "tenant-1");
        const second = await strapiFindOneByTenant("home-contents", "tenant-1");

        expect(first).toEqual({ id: "entry-1", title: "Home" });
        expect(second).toEqual(first);
        expect(mocks.fetch).toHaveBeenCalledTimes(1);
        expect(contentCacheSize()).toBe(1);
    });

    it("keys the cache by tenant so one tenant cannot read another's content", async () => {
        await strapiFindOneByTenant("home-contents", "tenant-1");
        await strapiFindOneByTenant("home-contents", "tenant-2");

        expect(mocks.fetch).toHaveBeenCalledTimes(2);
        expect(contentCacheSize()).toBe(2);
    });
});

describe("POST /api/revalidate", () => {
    it("purges the tenant's tag so the next Strapi read refetches", async () => {
        await strapiFindOneByTenant("home-contents", "tenant-1");
        expect(contentCacheSize()).toBe(1);

        const response = await revalidate({
            entry: { tenantId: "tenant-1" },
        });

        expect(response.status).toBe(200);
        // HTTP contract is unchanged.
        expect(await response.json()).toEqual({
            ok: true,
            revalidated: "content:tenant-1",
        });
        expect(contentCacheSize()).toBe(0);

        await strapiFindOneByTenant("home-contents", "tenant-1");
        expect(mocks.fetch).toHaveBeenCalledTimes(2);
    });

    it("invalidates registered TanStack Query clients", async () => {
        const invalidateQueries = vi.fn();
        const unregister = registerQueryClient({
            invalidateQueries,
        } as unknown as import("@tanstack/react-query").QueryClient);
        try {
            await revalidate({ tenantId: "tenant-1" });
            expect(invalidateQueries).toHaveBeenCalledTimes(1);
        } finally {
            unregister();
        }
    });

    it("rejects a bad secret without touching the cache", async () => {
        vi.stubEnv("REVALIDATE_SECRET", "s3cret");
        await strapiFindOneByTenant("home-contents", "tenant-1");

        const response = await revalidate(
            { tenantId: "tenant-1" },
            { "x-revalidate-secret": "wrong" },
        );

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ ok: false });
        expect(contentCacheSize()).toBe(1);
    });

    it("accepts the correct secret and keeps the flat tenantId payload shape", async () => {
        vi.stubEnv("REVALIDATE_SECRET", "s3cret");

        const response = await revalidate(
            { tenantId: "tenant-1" },
            { "x-revalidate-secret": "s3cret" },
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            revalidated: "content:tenant-1",
        });
    });

    it("returns 400 when the payload has no tenantId", async () => {
        const response = await revalidate({ entry: {} });

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            ok: false,
            reason: "falta tenantId en el payload",
        });
    });
});
