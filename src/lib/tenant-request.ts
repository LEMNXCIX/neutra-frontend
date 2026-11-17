import { getBackendUrl } from "./backend-url";

/** Mirrors the proxy's module vocabulary: root host, store or booking tenant. */
export type ModuleType = "store" | "booking" | "root";

export interface TenantResolution {
    slug: string;
    moduleType: ModuleType;
    tenantId: string;
}

export interface TenantRequestResult {
    request: Request;
    cookies: string[];
}

export type TenantLookupReason = "not_found" | "unavailable";

/**
 * An unknown tenant or an unreachable backend must never fall back to a
 * guessed module type: that would render one tenant's content under another
 * tenant's identity. The server entry converts this into the same 404/503 the
 * Next proxy returned.
 */
export class TenantLookupError extends Error {
    constructor(
        readonly slug: string,
        readonly reason: TenantLookupReason,
    ) {
        super(
            reason === "not_found"
                ? `Unknown tenant: ${slug}`
                : "Tenant configuration unavailable",
        );
        this.name = "TenantLookupError";
    }
}

/** Same 60s TTL and "never guess" rules as `src/proxy.ts`. */
const TENANT_CONFIG_TTL_MS = 60_000;

interface CachedConfig {
    moduleType: ModuleType;
    tenantId: string;
    expires: number;
}

const tenantConfigCache = new Map<string, CachedConfig>();

const SUPERADMIN: TenantResolution = {
    slug: "superadmin",
    moduleType: "root",
    tenantId: "",
};

const MODULE_LABELS = new Set(["store", "booking"]);

/**
 * Pull the tenant slug out of a `Host` header. Ports are ignored. A short
 * nip.io alias shaped `<module>.<slug>.nip.io` carries the module in the first
 * label, so the tenant identity is the second one; the full IP form
 * `<slug>.<a>.<b>.<c>.<d>.nip.io` keeps its first label.
 */
export function extractTenantSlug(host: string): string | null {
    const domain = (host || "localhost").split(":")[0];
    const parts = domain.split(".");
    const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(domain);
    const isLocalhost =
        domain === "localhost" ||
        domain === "127.0.0.1" ||
        domain.endsWith(".localhost");
    const isNipIo = domain.endsWith(".nip.io");

    let candidate = parts[0];
    if (
        isNipIo &&
        parts.length > 3 &&
        parts.length < 7 &&
        MODULE_LABELS.has(parts[0] ?? "")
    ) {
        candidate = parts[1];
    }

    if (isIp || !candidate) return null;
    if (
        candidate === "www" ||
        candidate === "api" ||
        candidate === "localhost" ||
        /^\d+$/.test(candidate)
    ) {
        return null;
    }
    if (!isNipIo && parts.length <= (isLocalhost ? 1 : 2)) return null;

    return candidate;
}

/**
 * Resolve tenant identity from `host`, using the same short-lived cache as the
 * Next proxy. A root host is always the superadmin surface without a backend
 * call; a tenant subdomain is resolved through the config endpoint.
 */
export async function resolveTenant(host: string): Promise<TenantResolution> {
    const slug = extractTenantSlug(host);
    if (!slug) return { ...SUPERADMIN };

    const cached = tenantConfigCache.get(slug);
    if (cached && cached.expires > Date.now()) {
        return {
            slug,
            moduleType: cached.moduleType,
            tenantId: cached.tenantId,
        };
    }

    let response: Response;
    try {
        response = await fetch(
            `${getBackendUrl()}/tenants/config/${encodeURIComponent(slug)}`,
        );
    } catch {
        throw new TenantLookupError(slug, "unavailable");
    }

    if (response.status === 404) {
        throw new TenantLookupError(slug, "not_found");
    }
    if (!response.ok) {
        throw new TenantLookupError(slug, "unavailable");
    }

    let result: {
        success?: boolean;
        data?: { type?: unknown; id?: unknown };
    };
    try {
        result = await response.json();
    } catch {
        throw new TenantLookupError(slug, "unavailable");
    }
    if (!result?.success || !result.data) {
        throw new TenantLookupError(slug, "unavailable");
    }

    const rawType = String(result.data.type ?? "").toLowerCase();
    let moduleType: ModuleType;
    if (!rawType || rawType === "store") {
        moduleType = "store";
    } else if (rawType === "booking") {
        moduleType = "booking";
    } else if (rawType === "root") {
        moduleType = "root";
    } else {
        // An unrecognised module type cannot be routed safely.
        throw new TenantLookupError(slug, "unavailable");
    }

    const tenantId = typeof result.data.id === "string" ? result.data.id : "";
    tenantConfigCache.set(slug, {
        moduleType,
        tenantId,
        expires: Date.now() + TENANT_CONFIG_TTL_MS,
    });

    return { slug, moduleType, tenantId };
}

/**
 * Resolve tenant identity strictly from the request's `Host` header.
 *
 * The original Next proxy never trusted client-supplied `x-tenant-*` headers or
 * tenant cookies for identity — a direct caller could otherwise claim any
 * tenant. The Host is the only source of truth; `applyTenantToRequest` then
 * overwrites the headers that downstream code reads.
 *
 * This helper never clones the Request: `new Request(request, { headers })`
 * transfers the body stream, which previously broke every JSON POST (including
 * the Strapi revalidate webhook) before a BFF handler could parse it.
 */
export async function resolveTenantIdentity(
    request: Request,
): Promise<TenantResolution> {
    const host = request.headers.get("host") ?? new URL(request.url).host;
    return resolveTenant(host);
}

/**
 * Inject the Host-derived tenant context into a Request and return the cookies
 * the server entry should write back. Any client-supplied `x-tenant-slug` /
 * `x-tenant-id` is overwritten (or removed) so it cannot claim another tenant.
 * Downstream backend forwarding still uses these headers as before.
 *
 * Only the server entry calls this — it intentionally owns the body from here
 * on. Request middleware must use `resolveTenantIdentity` instead.
 */
export async function applyTenantToRequest(
    request: Request,
): Promise<TenantRequestResult> {
    const tenant = await resolveTenantIdentity(request);
    const slug = tenant.slug;
    const tenantId = tenant.tenantId;

    const headers = new Headers(request.headers);
    headers.set("x-tenant-slug", slug);
    headers.set("x-module-type", tenant.moduleType);
    if (tenantId) headers.set("x-tenant-id", tenantId);
    else headers.delete("x-tenant-id"); // never let a forged header survive

    const cookies = [
        `tenant-slug=${encodeURIComponent(slug)}; Path=/; SameSite=Lax`,
        `module-type=${tenant.moduleType}; Path=/; SameSite=Lax`,
    ];
    if (tenantId) {
        cookies.push(
            `tenant-id=${encodeURIComponent(tenantId)}; Path=/; SameSite=Lax`,
        );
    }

    return { request: new Request(request, { headers }), cookies };
}
