import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || 'localhost';
    const url = request.nextUrl;

    // Extract port number
    const port = hostname.split(':')[1];

    // Extract subdomain
    const domain = hostname.split(':')[0];

    // Initialize tenant defaults
    let tenantSlug = 'default';
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

            // Try to get module type from cookie cache first
            const cachedModuleType = request.cookies.get(`${tenantSlug}-module-type`)?.value;
            const cachedTenantId = request.cookies.get(`${tenantSlug}-tenant-id`)?.value;

            if (cachedModuleType && cachedTenantId) {
                moduleType = cachedModuleType;
                tenantId = cachedTenantId;
            } else {
                // Fetch from backend API
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
                    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
                    console.log(`[Middleware] Fetching config for ${tenantSlug} from ${apiUrl}/tenants/config/${tenantSlug}`);

                    const response = await fetch(`${apiUrl}/tenants/config/${tenantSlug}`, {
                        next: { revalidate: 3600 } // Cache for 1 hour if supported
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log(`[Middleware] Config result for ${tenantSlug}:`, result);
                        if (result.success && result.data) {
                            moduleType = result.data.type?.toLowerCase() || 'store';
                            tenantId = result.data.id || '';
                        }
                    } else {
                        console.error(`[Middleware] Failed to fetch config for ${tenantSlug}: ${response.status} ${response.statusText}`);
                        // Simple heuristic fallback if API is down or tenant not found
                        if (tenantSlug.includes('booking') || tenantSlug.includes('book')) {
                            moduleType = 'booking';
                        } else {
                            moduleType = 'store';
                        }
                    }
                } catch (error) {
                    console.error('Error fetching tenant config in middleware:', error);
                    // Heuristic fallback
                    if (tenantSlug.includes('booking') || tenantSlug.includes('book')) {
                        moduleType = 'booking';
                    } else {
                        moduleType = 'store';
                    }
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
                tenantSlug = '';
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
            adminPath = url.pathname.replace(/^\/admin/, '/super-admin');
        }

        url.pathname = adminPath;
        const response = NextResponse.rewrite(url, {
            request: {
                headers: requestHeaders,
            },
        });
        response.cookies.set('tenant-slug', tenantSlug);
        response.cookies.set('module-type', moduleType);
        if (tenantId) response.cookies.set('tenant-id', tenantId);
        response.cookies.set(`${tenantSlug}-module-type`, moduleType, { maxAge: 3600 });
        if (tenantId) response.cookies.set(`${tenantSlug}-tenant-id`, tenantId, { maxAge: 3600 });
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
        response.cookies.set('tenant-slug', tenantSlug);
        response.cookies.set('module-type', moduleType);
        if (tenantId) response.cookies.set('tenant-id', tenantId);
        response.cookies.set(`${tenantSlug}-module-type`, moduleType, { maxAge: 3600 });
        if (tenantId) response.cookies.set(`${tenantSlug}-tenant-id`, tenantId, { maxAge: 3600 });
        return response;
    }

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Set cookie for client-side access
    response.cookies.set('tenant-slug', tenantSlug);
    response.cookies.set('module-type', moduleType);
    if (tenantId) response.cookies.set('tenant-id', tenantId);

    if (tenantSlug) {
        response.cookies.set(`${tenantSlug}-module-type`, moduleType, { maxAge: 3600 });
        if (tenantId) response.cookies.set(`${tenantSlug}-tenant-id`, tenantId, { maxAge: 3600 });
    }

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
