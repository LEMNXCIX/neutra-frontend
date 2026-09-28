import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/backend-url";

/**
 * Short-lived in-memory cache for tenant config (module type + tenant id).
 * Tenant types can change (e.g. store -> booking), so unlike the previous
 * cookie-based cache (1h), this keeps routing fresh while still avoiding
 * a backend fetch on every request.
 */
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

export async function proxy(request: NextRequest) {
    const hostname = request.headers.get("host") || "localhost";
    const url = request.nextUrl;

    // Extract subdomain
    const domain = hostname.split(":")[0];

    // Initialize tenant defaults
    let tenantSlug = "superadmin";
    let moduleType = "root"; // root, store, booking
    let tenantId = ""; // Initialize tenantId
    let shouldRewrite = false;
    let rewritePath = "";

    // 1. Subdomain-based routing (Works for both custom domains and subdomain.localhost)
    const hostParts = domain.split(".");

    // Check if we have a subdomain (e.g., book.localhost or tenant.neunetra.com)
    // For localhost, parts will be ['subdomain', 'localhost'] -> length 2
    // For production, parts will be ['subdomain', 'domain', 'com'] -> length 3
    const isLocalhost =
        domain === "localhost" ||
        domain === "127.0.0.1" ||
        domain.endsWith(".localhost");
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);
    const isNipIo = domain.endsWith(".nip.io");

    // Base parts: 1 for localhost/IP, 2 for domain.com, 6 for ip.nip.io
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

            // Resolve module type from the short-lived cache / backend API
            const config = await fetchTenantConfig(tenantSlug);

            if (!config.ok) {
                // Never guess a module type from the slug. Showing a storefront
                // under a tenant name that does not exist, or under a booking
                // name while the backend is down, serves one tenant's content
                // under another's identity. 404 for a name the backend does not
                // know, 503 when the backend itself cannot answer.
                if (config.reason === "not_found") {
                    return new NextResponse(`Unknown tenant: ${tenantSlug}`, {
                        status: 404,
                        headers: { "x-tenant-lookup": "not_found" },
                    });
                }
                return new NextResponse("Tenant configuration unavailable", {
                    status: 503,
                    headers: { "x-tenant-lookup": "unavailable" },
                });
            }

            moduleType = config.moduleType;
            tenantId = config.tenantId;
        }
    }

    // Root host with no subdomain is always the superadmin surface. Tenant
    // identity comes from the subdomain alone; there is no port-based fallback
    // and no slug-based guess. Local development uses subdomains too, e.g.
    // default.localhost:3001 or book.localhost:3001.

    // Default path rewrites for better UX
    if (moduleType === "store" && url.pathname === "/") {
        shouldRewrite = true;
        rewritePath = "/store";
    } else if (moduleType === "booking" && url.pathname === "/") {
        shouldRewrite = true;
        rewritePath = "/home";
    }

    // Clone the request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", tenantSlug);
    requestHeaders.set("x-module-type", moduleType);
    if (tenantId) requestHeaders.set("x-tenant-id", tenantId);

    // Handle Admin Rewrites
    if (url.pathname.startsWith("/admin")) {
        let adminPath = "";
        if (moduleType === "store") {
            adminPath = url.pathname.replace(/^\/admin/, "/store-admin");
        } else if (moduleType === "booking") {
            adminPath = url.pathname.replace(/^\/admin/, "/booking-admin");
        } else {
            // For superadmin tenant, keep /admin as is
            adminPath = url.pathname;
        }

        url.pathname = adminPath;
        const response = NextResponse.rewrite(url, {
            request: {
                headers: requestHeaders,
            },
        });
        response.cookies.set("tenant-slug", tenantSlug, { sameSite: "lax" });
        response.cookies.set("module-type", moduleType, { sameSite: "lax" });
        if (tenantId)
            response.cookies.set("tenant-id", tenantId, { sameSite: "lax" });
        return response;
    }

    // Handle rewriting if needed
    if (shouldRewrite) {
        url.pathname = rewritePath;
        const response = NextResponse.rewrite(url, {
            request: {
                headers: requestHeaders,
            },
        });
        // Set cookie for client-side access
        response.cookies.set("tenant-slug", tenantSlug, { sameSite: "lax" });
        response.cookies.set("module-type", moduleType, { sameSite: "lax" });
        if (tenantId)
            response.cookies.set("tenant-id", tenantId, { sameSite: "lax" });
        return response;
    }

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Set cookie for client-side access
    response.cookies.set("tenant-slug", tenantSlug, { sameSite: "lax" });
    response.cookies.set("module-type", moduleType, { sameSite: "lax" });
    if (tenantId)
        response.cookies.set("tenant-id", tenantId, { sameSite: "lax" });

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths including API routes
         * Exclude only static files and Next.js internals
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
