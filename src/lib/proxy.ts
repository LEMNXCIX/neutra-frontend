import { NextRequest } from 'next/server';

export function getProxyHeaders(req: NextRequest): HeadersInit {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Forward Auth Cookie
    const cookie = req.headers.get('cookie');
    if (cookie) {
        headers['Cookie'] = cookie;
    }

    // Forward Tenant ID and Slug
    // They might be injected by middleware into headers OR come from client cookies
    const tenantIdHeader = req.headers.get('x-tenant-id');
    const tenantSlugHeader = req.headers.get('x-tenant-slug');
    const defaultTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'default-tenant-00000000-0000-0000-0000-000000000001';

    // Priority 1: Tenant Slug (more reliable for resolution)
    if (tenantSlugHeader) {
        headers['x-tenant-slug'] = tenantSlugHeader;
    } else {
        const tenantSlugCookie = req.cookies.get('tenant-slug');
        if (tenantSlugCookie) {
            headers['x-tenant-slug'] = tenantSlugCookie.value;
        }
    }

    // Priority 2: Tenant ID (Only if it's not the default/stale one)
    if (tenantIdHeader && tenantIdHeader !== defaultTenantId) {
        headers['x-tenant-id'] = tenantIdHeader;
    } else if (!headers['x-tenant-slug']) {
        // Only try cookie if we don't have a slug yet
        const tenantIdCookie = req.cookies.get('tenant-id');
        if (tenantIdCookie && tenantIdCookie.value !== defaultTenantId) {
            headers['x-tenant-id'] = tenantIdCookie.value;
        }
    }

    // Forward Origin/Host for correct link generation in backend
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'http';

    if (origin && origin !== 'null') {
        headers['x-original-origin'] = origin;
    } else if (referer) {
        try {
            headers['x-original-origin'] = new URL(referer).origin;
        } catch (e) {
            if (host) {
                headers['x-original-origin'] = `${forwardedProto}://${host}`;
            }
        }
    } else if (host) {
        headers['x-original-origin'] = `${forwardedProto}://${host}`;
    }

    return headers;
}
