import { stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const CLIENT_DIR = resolve(ROOT, "dist/client");

const CONTENT_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ico": "image/x-icon",
    ".map": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
};

export function contentType(path) {
    return (
        CONTENT_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream"
    );
}

/**
 * Resolve a URL pathname to a built client file. Returns null when the path is
 * not a safe, existing regular file under dist/client, so the Start handler
 * still owns routes (including /manifest.webmanifest) and SPA fallbacks.
 */
export async function resolveStaticFile(pathname) {
    let decoded;
    try {
        decoded = decodeURIComponent(pathname);
    } catch {
        return null;
    }

    const candidate = resolve(join(CLIENT_DIR, decoded));
    if (candidate !== CLIENT_DIR && !candidate.startsWith(CLIENT_DIR + sep)) {
        return null;
    }

    try {
        const info = await stat(candidate);
        return info.isFile() ? candidate : null;
    } catch {
        return null;
    }
}
