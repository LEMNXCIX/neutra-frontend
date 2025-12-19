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

    return headers;
}
