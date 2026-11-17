/**
 * Custom server entry behaviour: tenant Host-derived identity, UX rewrites,
 * webhook passthrough and the tenant-scoped SSE feed.
 *
 * `createStartHandler` is mocked so the test can observe the exact Request the
 * Start pipeline receives (its URL and injected tenant headers) without booting
 * a router. Rewritten paths are validated against the REAL generated route tree
 * (src/routeTree.gen.ts), not just a hardcoded string, so a rewrite to a
 * non-existent route fails the test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";

const h = vi.hoisted(() => ({
    downstream: [] as Array<{ url: string; headers: Headers }>,
}));

vi.mock("@tanstack/react-start/server", () => ({
    createServerEntry: (entry: {
        fetch: (
            request: Request,
            opts?: unknown,
        ) => Promise<Response> | Response;
    }) => entry,
    createStartHandler: () => async (request: Request) => {
        h.downstream.push({
            url: request.url,
            headers: new Headers(request.headers),
        });
        return new Response("ok", {
            headers: { "content-type": "text/plain" },
        });
    },
    defaultStreamHandler: () => undefined,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { fetch as serverFetch } from "@/server";

/** Every path in the real generated tree, with trailing slashes normalised. */
type RouteNode = { options?: { path?: string }; children?: RouteNode[] };

function generatedRoutePaths(): Set<string> {
    const paths = new Set<string>();
    const walk = (node: RouteNode) => {
        const path = node.options?.path;
        if (typeof path === "string") {
            paths.add(path.length > 1 ? path.replace(/\/$/, "") : path);
        }
        for (const child of node.children ?? []) walk(child);
    };
    walk(routeTree as RouteNode);
    return paths;
}

const configResponse = (type: string, id: string) => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { type, id } }),
});

beforeEach(() => {
    vi.clearAllMocks();
    h.downstream.length = 0;
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
                const slug = decodeURIComponent(
                    url.split("/tenants/config/")[1] ?? "",
                );
                if (slug === "storeco")
                    return configResponse("STORE", "tenant-1");
                if (slug === "bookco")
                    return configResponse("BOOKING", "tenant-book");
                // "acme" is the booking tenant used by the legacy assertion.
                return configResponse("BOOKING", "tenant-uuid-1");
            }
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        },
    );
});

async function requestFor(
    host: string,
    pathname = "/",
    headers: Record<string, string> = {},
) {
    return serverFetch(
        new Request(`http://${host}${pathname}`, {
            headers: { host, ...headers },
        }),
    );
}

function downstreamPath(index = 0): string {
    expect(h.downstream.length).toBeGreaterThan(index);
    return new URL(h.downstream[index].url).pathname;
}

describe("server entry — Host-derived tenant routes", () => {
    it("redirects booking root to the real /home route and sets tenant cookies", async () => {
        const response = await requestFor("booking.acme.nip.io");

        // An internal rewrite rendered /home but hydrated as /, so the client
        // re-rendered the superadmin landing. A 307 keeps URL and route in sync.
        expect(response.status).toBe(307);
        const location = response.headers.get("location");
        expect(location).toBe("/home");
        expect(generatedRoutePaths().has(location!)).toBe(true);
        expect(h.downstream).toHaveLength(0);

        const cookies = response.headers.getSetCookie().join("; ");
        expect(cookies).toContain("tenant-slug=acme");
        expect(cookies).toContain("module-type=booking");
    });

    it("redirects store root to /store (also a real route)", async () => {
        const response = await requestFor("storeco.localhost:3001");
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe("/store");
        expect(generatedRoutePaths().has("/store")).toBe(true);
    });

    it("keeps the superadmin root at /", async () => {
        const response = await requestFor("localhost:3001");
        expect(response.status).toBe(200);
        expect(downstreamPath()).toBe("/");
    });

    it("ports the /admin alias for store, booking and superadmin", async () => {
        const store = await requestFor(
            "storeco.localhost:3001",
            "/admin/orders",
        );
        expect(store.status).toBe(307);
        expect(store.headers.get("location")).toBe("/store-admin/orders");
        expect(generatedRoutePaths().has("/store-admin/orders")).toBe(true);

        const booking = await requestFor("booking.acme.nip.io", "/admin");
        expect(booking.status).toBe(307);
        expect(booking.headers.get("location")).toBe("/booking-admin");
        expect(generatedRoutePaths().has("/booking-admin")).toBe(true);

        const root = await requestFor("localhost:3001", "/admin");
        expect(root.status).toBe(200);
        expect(downstreamPath()).toBe("/admin");
        expect(generatedRoutePaths().has("/admin")).toBe(true);
    });

    it("ignores forged x-tenant-* headers: Host is the only identity source", async () => {
        const response = await requestFor("storeco.localhost:3001", "/", {
            "x-tenant-slug": "victim",
            "x-tenant-id": "victim-id",
            "x-module-type": "booking",
        });
        const cookies = response.headers.getSetCookie().join("; ");
        expect(cookies).toContain("tenant-slug=storeco");
        expect(cookies).toContain("module-type=store");
        expect(response.headers.get("location")).toBe("/store");
    });

    it("removes a forged x-tenant-id on the superadmin host", async () => {
        await requestFor("localhost:3001", "/", {
            "x-tenant-id": "forged-id",
            "x-tenant-slug": "forged-slug",
        });
        const headers = h.downstream[0].headers;
        expect(headers.get("x-tenant-id")).toBeNull();
        expect(headers.get("x-tenant-slug")).toBe("superadmin");
    });
});

describe("server entry — webhook passthrough", () => {
    it("passes webhook body and signature through untouched", async () => {
        const body = '{"id":"evt_1"}';
        const response = await serverFetch(
            new Request("http://localhost:3001/api/webhooks/stripe", {
                method: "POST",
                headers: {
                    host: "localhost:3001",
                    "content-type": "application/json",
                    "x-stripe-signature": "sig",
                },
                body,
            }),
        );

        const webhookCall = mockFetch.mock.calls.find(([input]) =>
            String(input).includes("/webhooks/stripe"),
        );
        expect(webhookCall).toBeDefined();

        const [url, init] = webhookCall as [string, RequestInit];
        expect(String(url)).toBe("http://localhost:4000/api/webhooks/stripe");
        expect(init.method).toBe("POST");
        expect(new Headers(init.headers).get("x-stripe-signature")).toBe("sig");
        expect(await new Response(init.body).text()).toBe(body);

        // Webhooks bypass the Start pipeline entirely: no tenant context is
        // injected and no tenant cookies are written onto the backend reply.
        expect(h.downstream).toHaveLength(0);
        expect(response.headers.getSetCookie()).toHaveLength(0);
        expect(response.status).toBe(200);
    });
});

describe("server entry — tenant-scoped SSE", () => {
    async function openStream(host: string, signal?: AbortSignal) {
        const response = await serverFetch(
            new Request(`http://${host}/api/revalidate/events`, {
                headers: { host },
                signal,
            }),
        );
        expect(response.headers.get("content-type")).toContain(
            "text/event-stream",
        );
        expect(h.downstream).toHaveLength(0);
        return response;
    }

    it("streams only the caller's tenant tag", async () => {
        const { notifyContentRevalidated } = await import(
            "@/lib/content-cache"
        );
        const response = await openStream("storeco.localhost:3001");
        const body = response.body;
        if (!body) throw new Error("SSE response must have a body");
        const reader = body.getReader();
        try {
            await reader.read(); // ": connected" flush
            notifyContentRevalidated("content:tenant-book"); // other tenant
            notifyContentRevalidated("content:tenant-1"); // our tenant
            let received = "";
            for (
                let attempt = 0;
                attempt < 4 && !received.includes("data:");
                attempt++
            ) {
                received += new TextDecoder().decode(
                    (await reader.read()).value,
                );
            }
            expect(received).toContain("data: content:tenant-1");
            expect(received).not.toContain("content:tenant-book");
        } finally {
            await reader.cancel();
        }
    });

    it("clears the SSE heartbeat and listener when the client disconnects", async () => {
        const { contentRevalidatedListenerCount } = await import(
            "@/lib/content-cache"
        );
        const baseline = contentRevalidatedListenerCount();
        const clearInterval = vi.spyOn(globalThis, "clearInterval");
        const controller = new AbortController();

        const response = await openStream(
            "storeco.localhost:3001",
            controller.signal,
        );
        const reader = response.body?.getReader();
        if (!reader) throw new Error("SSE response must have a body");

        try {
            await reader.read();
            expect(contentRevalidatedListenerCount()).toBe(baseline + 1);
            controller.abort();
            const { done } = await reader.read();
            expect(done).toBe(true);
            expect(contentRevalidatedListenerCount()).toBe(baseline);
            expect(clearInterval).toHaveBeenCalled();
        } finally {
            await reader.cancel().catch(() => {});
            clearInterval.mockRestore();
        }
    });
});
