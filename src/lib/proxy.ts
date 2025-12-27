import { NextRequest } from 'next/server';

export function getProxyHeaders(req: NextRequest): HeadersInit {
    const headers: HeadersInit = {
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

    // Debug logging
    console.log('[getProxyHeaders] tenantSlugHeader:', tenantSlugHeader);
    console.log('[getProxyHeaders] tenant-slug cookie:', req.cookies.get('tenant-slug')?.value);

    if (tenantIdHeader) {
        headers['x-tenant-id'] = tenantIdHeader;
    } else if (!tenantSlugHeader) {
        const tenantIdCookie = req.cookies.get('tenant-id');
        if (tenantIdCookie) {
            headers['x-tenant-id'] = tenantIdCookie.value;
        }
    }

    if (tenantSlugHeader) {
        headers['x-tenant-slug'] = tenantSlugHeader;
    } else {
        const tenantSlugCookie = req.cookies.get('tenant-slug');
        if (tenantSlugCookie) {
            headers['x-tenant-slug'] = tenantSlugCookie.value;
        }
    }

    // Forward Origin/Host for correct link generation in backend
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'http';

    if (origin) {
        headers['x-original-origin'] = origin;
    } else if (host) {
        // Fallback for non-CORS requests or when origin is missing
        headers['x-original-origin'] = `${forwardedProto}://${host}`;
    }

    console.log('[getProxyHeaders] Final headers:', headers);

    return headers;
}
