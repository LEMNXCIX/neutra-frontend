/** Web-standard port of the proxy header helper (formerly typed as NextRequest). */

const cookieValue = (req: Request, name: string): string | undefined => {
    const cookie = req.headers.get("cookie");
    if (!cookie) return undefined;
    for (const part of cookie.split(";")) {
        const separator = part.indexOf("=");
        if (separator < 0) continue;
        if (part.slice(0, separator).trim() === name) {
            return decodeURIComponent(part.slice(separator + 1).trim());
        }
    }
    return undefined;
};

export function getProxyHeaders(req: Request): HeadersInit {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    const cookie = req.headers.get("cookie");
    if (cookie) {
        headers.Cookie = cookie;
    }

    const tenantIdHeader = req.headers.get("x-tenant-id");
    const tenantSlugHeader = req.headers.get("x-tenant-slug");
    const defaultTenantId =
        process.env.NEXT_PUBLIC_DEFAULT_TENANT ||
        "default-tenant-00000000-0000-0000-0000-000000000001";

    // Priority 1: slug (more reliable for resolution).
    if (tenantSlugHeader) {
        headers["x-tenant-slug"] = tenantSlugHeader;
    } else {
        const tenantSlugCookie = cookieValue(req, "tenant-slug");
        if (tenantSlugCookie) {
            headers["x-tenant-slug"] = tenantSlugCookie;
        }
    }

    // Priority 2: tenant id, ignoring the stale default value.
    if (tenantIdHeader && tenantIdHeader !== defaultTenantId) {
        headers["x-tenant-id"] = tenantIdHeader;
    } else if (!headers["x-tenant-slug"]) {
        const tenantIdCookie = cookieValue(req, "tenant-id");
        if (tenantIdCookie && tenantIdCookie !== defaultTenantId) {
            headers["x-tenant-id"] = tenantIdCookie;
        }
    }

    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const host = req.headers.get("host");
    const forwardedProto = req.headers.get("x-forwarded-proto") || "http";

    if (origin && origin !== "null") {
        headers["x-original-origin"] = origin;
    } else if (referer) {
        try {
            headers["x-original-origin"] = new URL(referer).origin;
        } catch (_e) {
            if (host) {
                headers["x-original-origin"] = `${forwardedProto}://${host}`;
            }
        }
    } else if (host) {
        headers["x-original-origin"] = `${forwardedProto}://${host}`;
    }

    return headers;
}
