import { getBackendUrl } from "@/lib/backend-url";

/**
 * Tenant-resolution contract reference, ported from the Next middleware to
 * Web-standard Request/Response. The live runtime performs the same work in
 * `src/server.ts`; this module keeps the resolution rules under test.
 */

/** Short-lived cache keyed by tenant slug. Module types can change, so the
 *  previous one-hour cookie cache was replaced with this 60s cache. */
const TENANT_CONFIG_TTL_MS = 60_000;
const tenantConfigCache = new Map<
    string,
    { moduleType: string; tenantId: string; expires: number }
>();

/** Why a tenant subdomain could not be resolved. */
type TenantLookup =
    | { ok: true; moduleType: string; tenantId: string }
    /** The backend answered, and the tenant does not exist. */
    | { ok: false; reason: "not_found" }
    /** The backend could not be reached or answered something unusable. */
    | { ok: false; reason: "unavailable" };

async function fetchTenantConfig(tenantSlug: string): Promise<TenantLookup> {
    const cached = tenantConfigCache.get(tenantSlug);
    if (cached && cached.expires > Date.now()) {
        return { ok: true, ...cached };
    }

    try {
        const response = await fetch(
            `${getBackendUrl()}/tenants/config/${tenantSlug}`,
        );

        if (response.status === 404) {
            return { ok: false, reason: "not_found" };
        }
        if (!response.ok) {
            return { ok: false, reason: "unavailable" };
        }

        const result = await response.json();
        if (!result.success || !result.data) {
            return { ok: false, reason: "unavailable" };
        }

        const config = {
            moduleType: result.data.type?.toLowerCase() || "store",
            tenantId: result.data.id || "",
        };
        tenantConfigCache.set(tenantSlug, {
            ...config,
            expires: Date.now() + TENANT_CONFIG_TTL_MS,
        });
        return { ok: true, ...config };
    } catch {
        return { ok: false, reason: "unavailable" };
    }
}

/** The request/response pair produced for one incoming request. */
export type ProxyOutcome = {
    kind: "next" | "rewrite" | "error";
    url?: string;
    status: number;
    /** Headers carrying the resolved tenant context to the downstream request. */
    headers: Headers;
    response: Response;
};

const appendTenantCookies = (
    response: Response,
    tenantSlug: string,
    moduleType: string,
    tenantId: string,
): Response => {
    const headers = new Headers(response.headers);
    const cookie = (name: string, value: string) =>
        `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
    headers.append("set-cookie", cookie("tenant-slug", tenantSlug));
    headers.append("set-cookie", cookie("module-type", moduleType));
    if (tenantId) {
        headers.append("set-cookie", cookie("tenant-id", tenantId));
    }
    return new Response(null, { status: response.status, headers });
};

export async function resolveProxy(request: Request): Promise<ProxyOutcome> {
    const hostname = request.headers.get("host") || "localhost";
    const url = new URL(request.url);

    const domain = hostname.split(":")[0];
    let tenantSlug = "superadmin";
    let moduleType = "root"; // root, store, booking
    let tenantId = "";
    let shouldRewrite = false;
    let rewritePath = "";

    const hostParts = domain.split(".");
    const isLocalhost =
        domain === "localhost" ||
        domain === "127.0.0.1" ||
        domain.endsWith(".localhost");
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);
    const isNipIo = domain.endsWith(".nip.io");
    const basePartsCount = isNipIo ? 6 : isLocalhost || isIP ? 1 : 2;

    if (!isIP && hostParts.length > basePartsCount) {
        const resolvedSlug = hostParts[0];
        if (
            resolvedSlug &&
            resolvedSlug !== "www" &&
            resolvedSlug !== "api" &&
            resolvedSlug !== "localhost" &&
            !/^\d+$/.test(resolvedSlug)
        ) {
            tenantSlug = resolvedSlug;
            const config = await fetchTenantConfig(tenantSlug);

            // Never guess a module type from the slug: an unknown name must
            // not render another tenant's storefront.
            if (!config.ok) {
                const status = config.reason === "not_found" ? 404 : 503;
                const response = new Response(
                    config.reason === "not_found"
                        ? `Unknown tenant: ${tenantSlug}`
                        : "Tenant configuration unavailable",
                    {
                        status,
                        headers: { "x-tenant-lookup": config.reason },
                    },
                );
                return {
                    kind: "error",
                    status,
                    headers: new Headers(request.headers),
                    response,
                };
            }

            moduleType = config.moduleType;
            tenantId = config.tenantId;
        }
    }

    if (moduleType === "store" && url.pathname === "/") {
        shouldRewrite = true;
        rewritePath = "/store";
    } else if (moduleType === "booking" && url.pathname === "/") {
        shouldRewrite = true;
        rewritePath = "/home";
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", tenantSlug);
    requestHeaders.set("x-module-type", moduleType);
    if (tenantId) requestHeaders.set("x-tenant-id", tenantId);

    const rewrite = (kind: "next" | "rewrite", pathname?: string) => {
        if (pathname) url.pathname = pathname;
        const response = appendTenantCookies(
            new Response(null, {
                status: 200,
                headers: pathname
                    ? { "x-proxy-rewrite": pathname }
                    : { "x-proxy-continue": "1" },
            }),
            tenantSlug,
            moduleType,
            tenantId,
        );
        return {
            kind,
            url: pathname ? String(url) : undefined,
            status: 200,
            headers: requestHeaders,
            response,
        } satisfies ProxyOutcome;
    };

    if (url.pathname.startsWith("/admin")) {
        const adminPath =
            moduleType === "store"
                ? url.pathname.replace(/^\/admin/, "/store-admin")
                : moduleType === "booking"
                  ? url.pathname.replace(/^\/admin/, "/booking-admin")
                  : url.pathname;
        return rewrite("rewrite", adminPath);
    }

    if (shouldRewrite) return rewrite("rewrite", rewritePath);
    return rewrite("next");
}

/** Web-middleware entry point: returns the Response for the resolved request. */
export async function proxy(request: Request): Promise<Response> {
    return (await resolveProxy(request)).response;
}
