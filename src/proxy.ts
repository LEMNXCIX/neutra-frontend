import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

async function fetchTenantConfig(
    tenantSlug: string,
): Promise<{ moduleType: string; tenantId: string } | null> {
    const cached = tenantConfigCache.get(tenantSlug);
    if (cached && cached.expires > Date.now()) {
        return { moduleType: cached.moduleType, tenantId: cached.tenantId };
    }

    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
        const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
        const response = await fetch(`${apiUrl}/tenants/config/${tenantSlug}`);

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const config = {
                    moduleType: result.data.type?.toLowerCase() || 'store',
                    tenantId: result.data.id || '',
                };
                tenantConfigCache.set(tenantSlug, {
                    ...config,
                    expires: Date.now() + TENANT_CONFIG_TTL_MS,
                });
                return config;
            }
        }
    } catch {
        // Fall through to null; caller applies heuristic fallback
    }
    return null;
}

export async function proxy(request: NextRequest) {
    const hostname = request.headers.get('host') || 'localhost';
    const url = request.nextUrl;

    // Extract port number
    const port = hostname.split(':')[1];

    // Extract subdomain
    const domain = hostname.split(':')[0];

    // Initialize tenant defaults
    let tenantSlug = 'superadmin';
    let moduleType = 'root'; // root, store, booking
    let tenantId = ''; // Initialize tenantId
    let shouldRewrite = false;
    let rewritePath = '';

    // 1. Subdomain-based routing (Works for both custom domains and subdomain.localhost)
    const hostParts = domain.split('.');

    // Check if we have a subdomain (e.g., booking1.localhost or tenant.neunetra.com)
    // For localhost, parts will be ['subdomain', 'localhost'] -> length 2
    // For production, parts will be ['subdomain', 'domain', 'com'] -> length 3
    const isLocalhost = domain === 'localhost' || domain === '127.0.0.1' || domain.endsWith('.localhost');
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);
    const isNipIo = domain.endsWith('.nip.io');

    // Base parts: 1 for localhost/IP, 2 for domain.com, 6 for ip.nip.io
    const basePartsCount = isNipIo ? 6 : (isLocalhost || isIP ? 1 : 2);

    if (!isIP && hostParts.length > basePartsCount) {
        const resolvedSlug = hostParts[0];
        if (resolvedSlug && resolvedSlug !== 'www' && resolvedSlug !== 'api' && resolvedSlug !== 'localhost' && !/^\d+$/.test(resolvedSlug)) {
            tenantSlug = resolvedSlug;

            // Resolve module type from the short-lived cache / backend API
            const config = await fetchTenantConfig(tenantSlug);
            if (config) {
                moduleType = config.moduleType;
                tenantId = config.tenantId;
            } else {
                // Heuristic fallback if API is down or tenant not found
                if (tenantSlug.includes('booking') || tenantSlug.includes('book')) {
                    moduleType = 'booking';
                } else {
                    moduleType = 'store';
                }
            }
        }
    }

    // 2. Port-based routing for localhost development (Legacy fallback)
    if (tenantSlug === 'default' || tenantSlug === '') {
        if (isLocalhost) {
            if (port === '3001') {
                tenantSlug = 'default';
                moduleType = 'store';
            } else if (port === '3002') {
                tenantSlug = 'booking1';
                moduleType = 'booking';
            } else if (port === '3000' && !domain.includes('.')) {
                // Only root if no subdomain
                tenantSlug = 'superadmin';
                moduleType = 'root';
            }
        }
    }

    // Default path rewrites for better UX
    if (moduleType === 'store' && url.pathname === '/') {
        shouldRewrite = true;
        rewritePath = '/store';
    } else if (moduleType === 'booking' && url.pathname === '/') {
        shouldRewrite = true;
        rewritePath = '/services';
    }

    // Clone the request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);
    requestHeaders.set('x-module-type', moduleType);
    if (tenantId) requestHeaders.set('x-tenant-id', tenantId);

    // Handle Admin Rewrites
    if (url.pathname.startsWith('/admin')) {
        let adminPath = '';
        if (moduleType === 'store') {
            adminPath = url.pathname.replace(/^\/admin/, '/store-admin');
        } else if (moduleType === 'booking') {
            adminPath = url.pathname.replace(/^\/admin/, '/booking-admin');
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
        response.cookies.set('tenant-slug', tenantSlug, { sameSite: 'lax' });
        response.cookies.set('module-type', moduleType, { sameSite: 'lax' });
        if (tenantId) response.cookies.set('tenant-id', tenantId, { sameSite: 'lax' });
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
        response.cookies.set('tenant-slug', tenantSlug, { sameSite: 'lax' });
        response.cookies.set('module-type', moduleType, { sameSite: 'lax' });
        if (tenantId) response.cookies.set('tenant-id', tenantId, { sameSite: 'lax' });
        return response;
    }

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Set cookie for client-side access
    response.cookies.set('tenant-slug', tenantSlug, { sameSite: 'lax' });
    response.cookies.set('module-type', moduleType, { sameSite: 'lax' });
    if (tenantId) response.cookies.set('tenant-id', tenantId, { sameSite: 'lax' });

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths including API routes
         * Exclude only static files and Next.js internals
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
