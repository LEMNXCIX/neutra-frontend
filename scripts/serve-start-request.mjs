/** Node HTTP Request -> Web Request adapter used by scripts/serve-start.mjs.
 *  Kept separate so the body handling has a runnable regression test. */

/**
 * Tie a Web Request's AbortSignal to the Node request/response lifecycle.
 *
 * A client disconnect fires `aborted` on the IncomingMessage and `close` on the
 * ServerResponse. Without this bridge the Web Request handed to Start has a
 * signal nobody aborts, so a long-lived stream (the SSE invalidation feed)
 * keeps its heartbeat timer and event listener alive for every gone browser.
 */
export function createRequestAbortController(req, res) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    req.once("aborted", abort);
    res.once("close", abort);
    return controller;
}

export async function toWebRequest(
    req,
    port = Number(process.env.PORT ?? 3001),
    signal,
) {
    const host = req.headers.host ?? `localhost:${port}`;
    const url = new URL(req.url ?? "/", `http://${host}`);
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        for (const item of Array.isArray(value) ? value : [value]) {
            headers.append(name, item);
        }
    }

    const method = req.method ?? "GET";
    // A Request body must be bytes, not a Promise. Passing the Promise straight
    // in stringifies it ("[object Promise]"), so request.json() in every BFF
    // handler silently failed and webhooks/POSTs could never parse their input.
    let body;
    if (method !== "GET" && method !== "HEAD") {
        body = await new Promise((resolve, reject) => {
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", () => resolve(Buffer.concat(chunks)));
            req.on("error", reject);
        });
    }

    return new Request(url, { method, headers, body, signal });
}
