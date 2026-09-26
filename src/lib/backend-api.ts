/**
 * Backend API Client
 * Centralized, type-safe client for external backend communication
 */

import { headers as getRequestHeaders } from 'next/headers';

import { getBackendUrl } from './backend-url';

// ============================================================================
// Configuration
// ============================================================================

const TOKEN_COOKIE_NAME = 'token';

/**
 * Header names whose values are credentials or session material. They are
 * redacted before anything reaches a log sink.
 */
const SENSITIVE_HEADERS = new Set(['cookie', 'authorization', 'set-cookie']);

/**
 * Derive the public origin of the incoming request so the backend can build
 * absolute links (receipts, password-reset URLs) against the tenant host rather
 * than against its own internal address. Lives here, next to the tenant
 * forwarding, so every BFF call carries it instead of only the routes that
 * happened to remember getProxyHeaders.
 */
const resolveOriginalOrigin = (h: Headers): string | null => {
    const origin = h.get('origin');
    if (origin && origin !== 'null') return origin;

    const referer = h.get('referer');
    if (referer) {
        try {
            return new URL(referer).origin;
        } catch {
            // Malformed referer: fall through to host-based reconstruction.
        }
    }

    const host = h.get('host');
    if (!host) return null;
    const proto = h.get('x-forwarded-proto') || 'http';
    return `${proto}://${host}`;
};

/**
 * Redact credential-bearing headers so request/response logging can never leak a
 * JWT. Explicit opt-in via LOG_HEADERS is not enough of a guard on its own: a
 * single log line is enough to persist a session in a log aggregator.
 */
const redactHeaders = (headers: Record<string, string>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    out[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? '[redacted]' : value;
  }
  return out;
};

// ============================================================================
// Types
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestConfig {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    token?: string;
    timeout?: number;
    cache?: RequestCache;
    next?: NextFetchRequestConfig;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    statusCode?: number;
}

export interface ApiError extends Error {
    statusCode?: number;
    response?: ApiResponse;
}

// ============================================================================
// Error Handling
// ============================================================================

class BackendApiError extends Error implements ApiError {
    statusCode?: number;
    response?: ApiResponse;

    constructor(message: string, statusCode?: number, response?: ApiResponse) {
        super(message);
        this.name = 'BackendApiError';
        this.statusCode = statusCode;
        this.response = response;
    }
}

// ============================================================================
// Core Client
// ============================================================================

/**
 * Make HTTP request to backend API
 */
async function request<T = unknown>(
    endpoint: string,
    config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
    const {
        method = 'GET',
        body,
        headers = {},
        token,
        timeout = 30000,
        cache,
        next,
    } = config;

    // Normalize endpoint
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${getBackendUrl()}${normalizedEndpoint}`;

    if (typeof window === 'undefined') {
        console.log(`[BackendApi] ${method} ${url}`);
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // Forward the incoming cookie jar. The backend authenticates from the
    // `token` cookie, and other cookies in the jar (tenant slug, refresh token)
    // are equally part of the caller's session. Rebuilding `Cookie: token=<jwt>`
    // silently dropped them, which is the root cause of the admin logout path
    // being rejected before it reached the backend.
    let forwardedCookieJar = false;
    if (typeof window === 'undefined') {
        try {
            // headers() is a promise in Next.js 15+. It throws outside a request
            // scope, which the catch handles for static generation and tests.
            const h = await getRequestHeaders();
            const cookie = h?.get('cookie');

            if (cookie) {
                requestHeaders['Cookie'] = cookie;
                forwardedCookieJar = true;
            }

            if (h) {
                const tenantId = h.get('x-tenant-id');
                const tenantSlug = h.get('x-tenant-slug');

                // Prioritize slug for better resolution reliability
                if (tenantSlug) {
                    requestHeaders['x-tenant-slug'] = tenantSlug;
                }

                // Only forward x-tenant-id if it exists AND is not the known default ID that causes conflicts
                const defaultTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'default-tenant-00000000-0000-0000-0000-000000000001';
                if (tenantId && tenantId !== defaultTenantId) {
                    requestHeaders['x-tenant-id'] = tenantId;
                }

                const originalOrigin = resolveOriginalOrigin(h);
                if (originalOrigin) {
                    requestHeaders['x-original-origin'] = originalOrigin;
                }
            }
        } catch (_e) {
            // next/headers might not be available in all contexts (e.g. static gen)
        }
    }

    // No incoming jar (e.g. a server-side call outside a request scope): send the
    // bare token so the call is still authenticated. Logged, because a request
    // that authenticates differently from the rest deserves to be visible.
    if (token && !forwardedCookieJar) {
        requestHeaders['Cookie'] = `${TOKEN_COOKIE_NAME}=${token}`;
        console.warn('[BackendApi] No incoming cookie jar; sending token-only Cookie header.');
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include',
        cache: cache || 'no-store',
        next,
    };

    if (typeof window === 'undefined' && process.env.LOG_HEADERS === 'true') {
        console.log(`[BackendApi] Headers:`, JSON.stringify(redactHeaders(requestHeaders), null, 2));
    }

    // Add body for mutation requests
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        fetchOptions.body = JSON.stringify(body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle 204 No Content
        if (response.status === 204) {
            return { success: true };
        }

        // Parse response
        const data = await response.json().catch(() => ({}));

        // Handle error responses
        if (!response.ok) {
            const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
            throw new BackendApiError(errorMessage, response.status, {
                success: false,
                error: errorMessage,
                statusCode: response.status,
                ...data,
            });
        }

        if (typeof window === 'undefined') {
            console.log(`[BackendApi] Response: ${response.status} ${response.statusText}`);
        }

        return {
            success: true,
            statusCode: response.status,
            ...data,
        };
    } catch (error) {
        if (typeof window === 'undefined') {
            console.error(`[BackendApi] ERROR:`, error);
        }
        clearTimeout(timeoutId);

        // Re-throw BackendApiError
        if (error instanceof BackendApiError) {
            throw error;
        }

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
            throw new BackendApiError('Request timeout', 408);
        }

        // Handle network errors
        if (error instanceof Error) {
            throw new BackendApiError(
                `Network error: ${error.message}`,
                0,
                { success: false, error: error.message }
            );
        }

        throw new BackendApiError('Unknown error occurred');
    }
}

// ============================================================================
// HTTP Method Helpers
// ============================================================================

/**
 * GET request
 */
export const get = <T = unknown>(
    endpoint: string,
    token?: string,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: 'GET', token, headers });
};

/**
 * POST request
 */
export const post = <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: 'POST', body, token, headers });
};

/**
 * PUT request
 */
export const put = <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: 'PUT', body, token, headers });
};

/**
 * PATCH request
 */
export const patch = <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: 'PATCH', body, token, headers });
};

/**
 * DELETE request
 */
export const del = <T = unknown>(
    endpoint: string,
    token?: string,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: 'DELETE', token, headers });
};

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

export const backendFetch = request;
export const backendGet = get;
export const backendPost = post;
export const backendPut = put;
export const backendDelete = del;

export type BackendResponse<T = unknown> = ApiResponse<T>;
export type BackendFetchOptions = ApiRequestConfig;

export { getBackendUrl } from './backend-url';

// ============================================================================
// Default Export (API Client Object)
// ============================================================================

export default {
    get,
    post,
    put,
    patch,
    delete: del,
    request,
    getBaseUrl: getBackendUrl,
} as const;
