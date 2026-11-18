// This module is loaded only from Start server-fn boundaries (see
// src/routes/_store.tsx); Start's import protection replaces Next's
// `server-only` marker, which Vite cannot resolve outside a React Server
// Component build.
import { getRequestHeader } from "@tanstack/react-start/server";
import { contentTag, getCached, setCached } from "./content-cache";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_TOKEN ?? "";

export async function getTenantIdFromHeaders(): Promise<string | null> {
    return getRequestHeader("x-tenant-id") ?? null;
}

/**
 * Fetch the published entry of a content type for the current tenant.
 * Returns null on miss or when Strapi is down: callers fall back to the
 * hardcoded defaults.
 *
 * # ponytail: 60s ISR cache instead of webhook-only; the revalidate route
 * (POST /api/revalidate) busts the `content:<tenantId>` tag on publish for
 * instant updates. `content-cache` is the Start replacement for Next's
 * `fetch(..., { next: { revalidate: 60, tags } })` data cache.
 */
export async function strapiFindOneByTenant<T = any>(
    contentType: string,
    tenantId: string | null,
    query = "",
): Promise<T | null> {
    if (!tenantId) return null;
    const url = `${STRAPI_URL}/api/${contentType}?status=published&filters[tenantId][$eq]=${encodeURIComponent(tenantId)}${query}`;
    const cacheKey = `strapi:${url}`;
    const cached = getCached<T | null>(cacheKey);
    if (cached !== undefined) return cached;
    try {
        const res = await fetch(url, {
            headers: STRAPI_TOKEN
                ? { Authorization: `Bearer ${STRAPI_TOKEN}` }
                : undefined,
        });
        if (!res.ok) return null;
        const json = await res.json();
        const entry = (json.data?.[0] ?? null) as T | null;
        return setCached(cacheKey, entry, {
            tags: [contentTag(tenantId)],
            ttlSeconds: 60,
        });
    } catch {
        return null;
    }
}

export async function getHomeContent(): Promise<any | null> {
    return strapiFindOneByTenant(
        "home-contents",
        await getTenantIdFromHeaders(),
    );
}

/** Fetch a per-tenant single-page content type (about-page, faq-page, ...). */
export async function getCmsPage(name: string): Promise<any | null> {
    return strapiFindOneByTenant(name, await getTenantIdFromHeaders());
}
