import { mkdir, readFile, writeFile } from "node:fs/promises";
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

/** The tenant header set that identifies each fixture. */
export function tenantHeaders(tenant) {
    return {
        "x-tenant-slug": tenant,
        "x-tenant-id": tenant,
    };
}

export function fixturePath(route) {
    return path.join(
        FIXTURES_DIR,
        `${route.tenant}-${encodeURIComponent(route.path)}.json`,
    );
}

export async function requestRoute(baseUrl, route) {
    const response = await fetch(new URL(route.path, baseUrl), {
        headers: tenantHeaders(route.tenant),
        redirect: "manual",
    });
    const body = await response.text();
    return { status: response.status, headers: response.headers, body };
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

async function capture() {
    const baseUrl = process.env.BASE_URL || DEFAULT_BASE_URL;
    const routes = await loadRoutes();
    await mkdir(FIXTURES_DIR, { recursive: true });

    let failures = 0;
    for (const route of routes) {
        let result;
        try {
            result = await requestRoute(baseUrl, route);
        } catch (error) {
            failures += 1;
            console.error(
                `FETCH ERROR ${route.tenant} ${route.path}: ${error.message}`,
            );
            result = {
                status: 0,
                headers: new Headers(),
                body: `Error: ${error.message}`,
            };
        }

        const fixture = {
            path: route.path,
            tenant: route.tenant,
            capturedAt: new Date().toISOString(),
            status: result.status,
            headers: headerSubset(result.headers),
            body: result.body,
        };
        const destination = fixturePath(route);
        await writeFile(destination, `${JSON.stringify(fixture, null, 2)}\n`);
        console.log(
            `CAPTURED ${route.tenant} ${route.path} -> ${path.relative(HERE, destination)} (status ${result.status})`,
        );
    }

    console.log(`Captured ${routes.length} route(s) from ${baseUrl}.`);
    if (failures) {
        console.error(`${failures} request(s) failed.`);
        process.exitCode = 1;
    }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
    capture().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
