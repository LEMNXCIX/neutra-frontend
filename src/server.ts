import {
    createServerEntry,
    createStartHandler,
    defaultStreamHandler,
} from "@tanstack/react-start/server";

import { getBackendUrl } from "./lib/backend-url";
import { onContentRevalidated } from "./lib/content-cache";
import { applyTenantToRequest, TenantLookupError } from "./lib/tenant-request";

const startHandler = createStartHandler(defaultStreamHandler);

const WEBHOOK_PREFIX = "/api/webhooks/";
const REVALIDATION_EVENTS_PATH = "/api/revalidate/events";

/**
 * SSE feed for browser QueryClients. The revalidate webhook runs in this
 * process; without a delivery path the browser half of the invalidation bridge
 * would never learn that Strapi published something. The endpoint is handled
 * here (not as a generated BFF route) so the 75-route API inventory stays
 * exactly the ported Next surface.
 */
function revalidationEventStream(request: Request): Response {
    const encoder = new TextEncoder();
    let unsubscribe = () => {};
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (text: string) => {
                try {
                    controller.enqueue(encoder.encode(text));
                } catch {
                    // The reader is gone; cancel()/abort will clean us up.
                }
            };
            // Flush the response headers immediately; without an initial chunk
            // the Node adapter buffers them until the first real event.
            send(": connected\n\n");
            unsubscribe = onContentRevalidated((tag) => {
                send(`data: ${tag}\n\n`);
            });
            // Keep idle connections alive through proxies that close streams.
            heartbeat = setInterval(() => send(": ping\n\n"), 25_000);
            request.signal.addEventListener(
                "abort",
                () => {
                    if (heartbeat) clearInterval(heartbeat);
                    unsubscribe();
                    try {
                        controller.close();
                    } catch {
                        // Already closed by the reader.
                    }
                },
                { once: true },
            );
        },
        cancel() {
            if (heartbeat) clearInterval(heartbeat);
            unsubscribe();
        },
    });

    return new Response(stream, {
        headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
        },
    });
}

/** A tenant name the backend does not know, or a backend that cannot answer,
 *  must never render a guessed storefront under that tenant's identity. */
function tenantErrorResponse(error: TenantLookupError): Response {
    return new Response(error.message, {
        status: error.reason === "not_found" ? 404 : 503,
        headers: { "x-tenant-lookup": error.reason },
    });
}

/**
 * Server-to-server webhooks bypass the Start pipeline. The rewrite has to keep
 * the method, raw bytes and every header (notably the signature) intact, so no
 * parsing, tenant headers or cookies are introduced here.
 */
async function forwardWebhook(request: Request, url: URL): Promise<Response> {
    const target = `${getBackendUrl()}/webhooks/${url.pathname.slice(WEBHOOK_PREFIX.length)}${url.search}`;
    const init: RequestInit = {
        method: request.method,
        headers: new Headers(request.headers),
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = await request.arrayBuffer();
    }
    return globalThis.fetch(target, init);
}

/** Append cookies with `append` so multiple Set-Cookie headers survive the
 *  Node adapter instead of being collapsed into one comma-joined value. */
function withTenantCookies(response: Response, cookies: string[]): Response {
    if (cookies.length === 0) return response;

    const headers = new Headers(response.headers);
    for (const cookie of cookies) {
        headers.append("set-cookie", cookie);
    }
    const body = [101, 204, 205, 304].includes(response.status)
        ? null
        : response.body;
    return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

export const fetch = createServerEntry({
    async fetch(request, opts) {
        const url = new URL(request.url);

        if (url.pathname === REVALIDATION_EVENTS_PATH) {
            return revalidationEventStream(request);
        }

        if (url.pathname.startsWith(WEBHOOK_PREFIX)) {
            return forwardWebhook(request, url);
        }

        let tenantRequest: Request;
        let cookies: string[];
        try {
            ({ request: tenantRequest, cookies } =
                await applyTenantToRequest(request));
        } catch (error) {
            if (error instanceof TenantLookupError) {
                return tenantErrorResponse(error);
            }
            throw error;
        }

        const forwardedUrl = new URL(tenantRequest.url);
        if (forwardedUrl.pathname === "/") {
            const moduleType = tenantRequest.headers.get("x-module-type");
            if (moduleType === "store" || moduleType === "booking") {
                forwardedUrl.pathname = `/${moduleType}`;
            }
        }

        const init: RequestInit = {
            method: tenantRequest.method,
            headers: tenantRequest.headers,
        };
        if (tenantRequest.method !== "GET" && tenantRequest.method !== "HEAD") {
            init.body = await tenantRequest.arrayBuffer();
        }

        const downstream = new Request(forwardedUrl, init);
        const response = await startHandler(downstream, opts);
        return withTenantCookies(response, cookies);
    },
}).fetch;

export default { fetch };
