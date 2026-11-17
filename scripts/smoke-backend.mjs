/**
 * Minimal backend stub for the CI Docker smoke. It answers the only call the
 * server entry needs to resolve a tenant from a real Host header:
 *   GET /api/tenants/config/:slug
 * Slugs beginning with "book" resolve to the booking module, everything else
 * to store. All other paths return an empty success envelope.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.SMOKE_BACKEND_PORT ?? 4001);

createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const match = url.pathname.match(/^\/api\/tenants\/config\/([^/]+)$/);
    let body = { success: true, data: {} };
    if (match) {
        const slug = decodeURIComponent(match[1]);
        const type = slug.toLowerCase().startsWith("book")
            ? "BOOKING"
            : "STORE";
        body = { success: true, data: { type, id: `tenant-${slug}` } };
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
}).listen(PORT, () => console.log(`smoke backend listening on ${PORT}`));
