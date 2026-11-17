/**
 * Custom server entry behaviour: tenant subdomain routing and webhook passthrough.
 *
 * `createStartHandler` is mocked so the test can observe the exact Request the
 * Start pipeline receives (its URL and injected tenant headers) without booting
 * a router. The real handler is wired in `src/server.ts` once Vite builds it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const tenantResponse = (type: string) => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { type, id: "tenant-uuid-1" } }),
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
                return tenantResponse("BOOKING");
            }
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        },
    );
});

describe("server entry", () => {
    it("rewrites booking subdomain to /booking and sets tenant cookies", async () => {
        const host = "booking.acme.nip.io";
        const response = await serverFetch(
            new Request(`http://${host}/`, { headers: { host } }),
        );

        expect(h.downstream).toHaveLength(1);
        expect(new URL(h.downstream[0].url).pathname).toBe("/booking");
        expect(h.downstream[0].headers.get("x-tenant-slug")).toBe("acme");
        expect(h.downstream[0].headers.get("x-module-type")).toBe("booking");

        const cookies = response.headers.getSetCookie().join("; ");
        expect(cookies).toContain("tenant-slug=acme");
        expect(cookies).toContain("module-type=booking");
    });

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

    it("streams revalidation events to connected browser query clients", async () => {
        const { notifyContentRevalidated } = await import(
            "@/lib/content-cache"
        );
        const response = await serverFetch(
            new Request("http://localhost:3001/api/revalidate/events"),
        );

        expect(response.headers.get("content-type")).toContain(
            "text/event-stream",
        );
        expect(h.downstream).toHaveLength(0);

        const body = response.body;
        expect(body).toBeDefined();
        if (!body) throw new Error("SSE response must have a body");
        const reader = body.getReader();
        try {
            notifyContentRevalidated("content:tenant-1");
            // The stream starts with a `: connected` comment that flushes the
            // headers; read through it to the actual event.
            let received = "";
            for (
                let attempt = 0;
                attempt < 3 && !received.includes("data:");
                attempt++
            ) {
                const { value } = await reader.read();
                received += new TextDecoder().decode(value);
            }
            expect(received).toContain("data: content:tenant-1");
        } finally {
            await reader.cancel();
        }
    });
});
