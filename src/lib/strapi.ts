import "server-only";
import { headers } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_TOKEN ?? "";

export async function getTenantIdFromHeaders(): Promise<string | null> {
    return (await headers()).get("x-tenant-id");
}

/**
 * Fetch the published entry of a content type for the current tenant.
 * Returns null on miss or when Strapi is down: callers fall back to the
 * hardcoded defaults.
 *
 * # ponytail: 60s ISR cache instead of webhook-only; the revalidate route
 * (POST /api/revalidate) busts the tag on publish for instant updates.
 */
export async function strapiFindOneByTenant<T = any>(
    contentType: string,
    tenantId: string | null,
    query = ""
): Promise<T | null> {
    if (!tenantId) return null;
    try {
        const url = `${STRAPI_URL}/api/${contentType}?status=published&filters[tenantId][$eq]=${encodeURIComponent(tenantId)}${query}`;
        const res = await fetch(url, {
            headers: STRAPI_TOKEN
                ? { Authorization: `Bearer ${STRAPI_TOKEN}` }
                : undefined,
            next: { revalidate: 60, tags: [`content:${tenantId}`] },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data?.[0] ?? null;
    } catch {
        return null;
    }
}

export async function getHomeContent(): Promise<any | null> {
    return strapiFindOneByTenant("home-content", await getTenantIdFromHeaders());
}

export async function getPageBySlug(slug: string): Promise<any | null> {
    return strapiFindOneByTenant(
        "page",
        await getTenantIdFromHeaders(),
        `&filters[slug][$eq]=${encodeURIComponent(slug)}&populate[blocks][populate]=*`
    );
}
