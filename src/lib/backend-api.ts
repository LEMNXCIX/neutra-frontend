/**
 * Backend API Client
 * Centralized, type-safe client for external backend communication
 */

// ============================================================================
// Configuration
// ============================================================================

const getBackendUrlConfig = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    return url.endsWith('/api') ? url : `${url}/api`;
};

const BACKEND_API_URL = getBackendUrlConfig();
const TOKEN_COOKIE_NAME = 'token';

/**
 * Ensure URL has protocol prefix
 */
const ensureProtocol = (url: string): string => {
    return url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `http://${url}`;
};

const BASE_URL = ensureProtocol(BACKEND_API_URL);

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
    const url = `${BASE_URL}${normalizedEndpoint}`;

    if (typeof window === 'undefined') {
        console.log(`[BackendApi] ${method} ${url}`);
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // Add authentication cookie if token provided
    if (token) {
        requestHeaders['Cookie'] = `${TOKEN_COOKIE_NAME}=${token}`;
    }

    // Forward Tenant Headers from Server Context
    // Only works in Server components/Server actions/API routes
    if (typeof window === 'undefined') {
        try {
            const { headers: nextHeaders } = require('next/headers');

            // In Next.js 15, headers() returns a Promise. 
            // We must await it before calling .get()
            const h = await nextHeaders();

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
            }
        } catch (e) {
            // next/headers might not be available in all contexts (e.g. static gen)
        }
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include',
        cache: cache || 'no-store',
        next,
    };

    if (typeof window === 'undefined') {
        console.log(`[BackendApi] Headers:`, JSON.stringify(requestHeaders, null, 2));
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

/**
 * Get configured backend URL
 */
export const getBackendUrl = (): string => BASE_URL;

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
