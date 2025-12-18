import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || 'localhost';
    const url = request.nextUrl;

    // Extract port number
    const port = hostname.split(':')[1];

    // Extract subdomain
    const domain = hostname.split(':')[0];

    // Initialize tenant defaults
    let tenantSlug = 'default';
    let moduleType = 'root'; // root, store, booking
    let shouldRewrite = false;
    let rewritePath = '';

    // Port-based routing for localhost development
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        if (port === '3000') {
            // port 3000 is for Super Admin global view
            tenantSlug = ''; // No slug = global
            moduleType = 'root';
        } else if (port === '3001') {
            tenantSlug = 'default'; // Store tenant slug
            moduleType = 'store';
            if (url.pathname === '/') {
                shouldRewrite = true;
                rewritePath = '/store';
            }
        } else if (port === '3002') {
            tenantSlug = 'booking1'; // Booking tenant slug
            moduleType = 'booking';
            if (url.pathname === '/') {
                shouldRewrite = true;
                rewritePath = '/services';
            }
        }
    }
    // Subdomain-based routing
    else if (domain !== 'localhost' && domain.includes('.')) {
        const parts = domain.split('.');
        if (parts.length > 1) {
            const resolvedSlug = parts[0];
            if (resolvedSlug && resolvedSlug !== 'www' && resolvedSlug !== 'api') {
                tenantSlug = resolvedSlug;

                // Simple heuristic for module type
                if (tenantSlug.includes('booking') || tenantSlug.includes('book')) {
                    moduleType = 'booking';
                } else {
                    moduleType = 'store';
                }
            }
        }
    }

    // Clone the request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);
    requestHeaders.set('x-module-type', moduleType);

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
