/**
 * Minimal backend stub for local visual checks and the CI Docker smoke.
 *
 * - GET  /api/tenants/config/:slug  -> tenant module used by the server entry
 * - POST /api/auth/login            -> signed-in user + HttpOnly token cookie
 * - GET  /api/auth/validate         -> same user (session check)
 * - POST /api/auth/logout           -> clears the token cookie
 *
 * Everything else returns an empty success envelope, matching the real API's
 * StandardResponse shape. Slugs beginning with "book" resolve to BOOKING,
 * everything else to STORE.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.SMOKE_BACKEND_PORT ?? 4001);

const SMOKE_USER = {
    id: "smoke-user-1",
    name: "Demo User",
    email: "demo@neutra.test",
    roleId: "smoke-role-admin",
    role: { name: "ADMIN" },
    profilePic: null,
};

const envelope = (data, message = "OK") => ({
    success: true,
    statusCode: 200,
    message,
    data,
    meta: {
        traceId: `smoke-${Date.now()}`,
        timestamp: new Date().toISOString(),
    },
});

const TOKEN_COOKIE =
    "token=smoke-token; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400";
const CLEAR_COOKIE =
    "token=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname;
    const headers = { "content-type": "application/json" };

    const tenantMatch = pathname.match(/^\/api\/tenants\/config\/([^/]+)$/);
    if (tenantMatch) {
        const slug = decodeURIComponent(tenantMatch[1]);
        const type = slug.toLowerCase().startsWith("book")
            ? "BOOKING"
            : "STORE";
        res.writeHead(200, headers);
        res.end(JSON.stringify(envelope({ type, id: `tenant-${slug}` })));
        return;
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
        res.writeHead(200, { ...headers, "set-cookie": TOKEN_COOKIE });
        res.end(JSON.stringify(envelope(SMOKE_USER, "Sesión iniciada")));
        return;
    }

    if (pathname === "/api/auth/validate" && req.method === "GET") {
        res.writeHead(200, headers);
        res.end(JSON.stringify(envelope(SMOKE_USER)));
        return;
    }

    if (pathname === "/api/auth/logout" && req.method === "POST") {
        res.writeHead(200, { ...headers, "set-cookie": CLEAR_COOKIE });
        res.end(JSON.stringify(envelope(null, "Sesión cerrada")));
        return;
    }

    res.writeHead(200, headers);
    res.end(JSON.stringify(envelope({})));
}).listen(PORT, () => console.log(`smoke backend listening on ${PORT}`));
