import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PARITY_DIR = path.resolve(HERE, "../tests/parity");
const FIXTURES_DIR = path.join(PARITY_DIR, "fixtures");
const ROUTES_FILE = path.join(PARITY_DIR, "routes.json");

export const DEFAULT_BASE_URL = "http://localhost:3001";

export async function loadRoutes() {
    const raw = await readFile(ROUTES_FILE, "utf8");
    const routes = JSON.parse(raw);
    if (!Array.isArray(routes)) {
        throw new Error(`${ROUTES_FILE} must contain a JSON array`);
    }
    return routes;
}

/** Tenant identity is carried as explicit headers and as the subdomain the Next
 * proxy actually resolves from `Host`. `PARITY_TENANT_DOMAIN` overrides the
 * domain portion for non-local environments. */
export function tenantHeaders(tenant, baseUrl = DEFAULT_BASE_URL) {
    const domain = process.env.PARITY_TENANT_DOMAIN || "localhost";
    const url = new URL(baseUrl);
    const port = url.port ? `:${url.port}` : "";
    return {
        "x-tenant-slug": tenant,
        "x-tenant-id": tenant,
        host: `${tenant}.${domain}${port}`,
    };
}

export function fixturePath(route, fixturesDir = FIXTURES_DIR) {
    return path.join(
        fixturesDir,
        `${route.tenant}-${encodeURIComponent(route.path)}.json`,
    );
}

/** node:http is used instead of fetch because fetch silently drops an
 * overridden `host` header, which would defeat tenant resolution. */
function requestOnce(url, headers) {
    return new Promise((resolve, reject) => {
        const transport = url.protocol === "https:" ? https : http;
        const request = transport.request(
            {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port || undefined,
                path: `${url.pathname}${url.search}`,
                method: "GET",
                headers,
            },
            (response) => {
                const chunks = [];
                response.on("data", (chunk) => chunks.push(chunk));
                response.on("end", () => {
                    const responseHeaders = new Headers();
                    for (const [name, value] of Object.entries(
                        response.headers,
                    )) {
                        if (value === undefined) continue;
                        for (const entry of Array.isArray(value)
                            ? value
                            : [value]) {
                            responseHeaders.append(name, String(entry));
                        }
                    }
                    resolve({
                        status: response.statusCode ?? 0,
                        headers: responseHeaders,
                        body: Buffer.concat(chunks).toString("utf8"),
                    });
                });
            },
        );
        const timeoutMs = Number(
            process.env.PARITY_REQUEST_TIMEOUT_MS ?? 10000,
        );
        request.setTimeout(timeoutMs, () => {
            request.destroy(
                new Error(`request timed out after ${timeoutMs}ms`),
            );
        });
        request.on("error", reject);
        request.end();
    });
}

export function requestRoute(baseUrl, route) {
    const url = new URL(route.path, baseUrl);
    return requestOnce(url, tenantHeaders(route.tenant, baseUrl));
}

function headerSubset(headers) {
    const picked = {};
    for (const name of [
        "content-type",
        "cache-control",
        "x-tenant-slug",
        "x-module-type",
        "x-tenant-id",
        "x-tenant-lookup",
    ]) {
        const value = headers.get(name);
        if (value !== null) picked[name] = value;
    }
    const cookies = (headers.getSetCookie?.() ?? []).filter((cookie) =>
        /^\s*(tenant-slug|module-type|tenant-id)=/i.test(cookie),
    );
    if (cookies.length) picked["set-cookie"] = cookies.sort();
    return picked;
}

export function hasTraceId(body) {
    try {
        const parsed = JSON.parse(body);
        return Boolean(
            parsed &&
                typeof parsed === "object" &&
                parsed.meta?.traceId != null,
        );
    } catch {
        return false;
    }
}

export function extractHrefs(body) {
    const hrefs = new Set();
    const pattern = /href\s*=\s*["']([^"']+)["']/gi;
    for (const match of body.matchAll(pattern)) hrefs.add(match[1]);
    return [...hrefs].sort();
}

export function envelopeKeys(body) {
    try {
        const parsed = JSON.parse(body);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return Object.keys(parsed).sort();
        }
    } catch {
        // HTML and plain text have no JSON envelope.
    }
    return [];
}

export function buildSnapshot({ status, body }) {
    return {
        status,
        hasTraceId: hasTraceId(body),
        hrefs: extractHrefs(body),
        envelopeKeys: envelopeKeys(body),
    };
}

export async function captureRoutes({
    baseUrl = process.env.BASE_URL || DEFAULT_BASE_URL,
    fixturesDir = FIXTURES_DIR,
} = {}) {
    const routes = await loadRoutes();
    const captured = [];

    // Collect every response before writing anything: a single failed request
    // must leave no partial baseline behind.
    for (const route of routes) {
        let result;
        try {
            result = await requestRoute(baseUrl, route);
        } catch (error) {
            throw new Error(
                `Failed to capture ${route.tenant} ${route.path} from ${baseUrl}: ${error.message}`,
                { cause: error },
            );
        }

        captured.push({
            route,
            fixture: {
                path: route.path,
                tenant: route.tenant,
                capturedAt: new Date().toISOString(),
                status: result.status,
                headers: headerSubset(result.headers),
                body: result.body,
            },
        });
    }

    await mkdir(fixturesDir, { recursive: true });
    for (const { route, fixture } of captured) {
        const destination = fixturePath(route, fixturesDir);
        await writeFile(destination, `${JSON.stringify(fixture, null, 2)}\n`);
        console.log(
            `CAPTURED ${route.tenant} ${route.path} -> ${path.relative(HERE, destination)} (status ${fixture.status})`,
        );
    }

    console.log(`Captured ${routes.length} route(s) from ${baseUrl}.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
    captureRoutes().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
