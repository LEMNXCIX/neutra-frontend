/**
 * Server-side Authentication Utilities
 * Handles token extraction and auth header construction for server-side requests
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const TOKEN_COOKIE_NAME = 'token'; // Changed from 'neutra_jwt' to match backend

/**
 * Extract JWT token from Next.js request cookies
 * Use this in API routes (app/api/*)
 * @param req - NextRequest object
 * @returns JWT token or undefined
 */
export function extractTokenFromRequest(req: NextRequest): string | undefined {
    const cookieHeader = req.headers.get('cookie') || '';

    // Split cookies and find neutra_jwt
    const cookies = cookieHeader.split(';').map(c => c.trim());

    const neutraJwtCookie = cookies.find((c) => c.startsWith(`${TOKEN_COOKIE_NAME}=`));

    if (!neutraJwtCookie) {
        return undefined;
    }

    // Extract token value (everything after "neutra_jwt=")
    const token = neutraJwtCookie.substring(`${TOKEN_COOKIE_NAME}=`.length);

    // Decode if URL encoded
    const decodedToken = decodeURIComponent(token);

    return decodedToken;
}

/**
 * Extract JWT token from Next.js cookies() function
 * Use this in server components (app/admin/*)
 * @returns JWT token or undefined
 */
export async function extractTokenFromCookies(): Promise<string | undefined> {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    return token;
}

/**
 * Get full cookie string from Next.js cookies() function
 * @returns Cookie string for forwarding
 */
export async function getCookieString(): Promise<string> {
    const cookieStore = await cookies();
    return cookieStore.toString();
}

/**
 * Build authorization headers from token
 * @param token - JWT token
 * @returns Headers object with Authorization if token exists
 */
export function buildAuthHeaders(token?: string): Record<string, string> {
    if (!token) {
        return {};
    }
    return {
        Authorization: `Bearer ${token}`,
    };
}

/**
 * Extract token from request and build auth headers
 * Convenience function for API routes
 * @param req - NextRequest object
 * @returns Headers object with Authorization if token exists
 */
export function getAuthHeadersFromRequest(req: NextRequest): Record<string, string> {
    const token = extractTokenFromRequest(req);
    return buildAuthHeaders(token);
}

/**
 * Extract token from cookies and build auth headers
 * Convenience function for server components
 * @returns Headers object with Authorization if token exists
 */
export async function getAuthHeadersFromCookies(): Promise<Record<string, string>> {
    const token = await extractTokenFromCookies();
    return buildAuthHeaders(token);
}
