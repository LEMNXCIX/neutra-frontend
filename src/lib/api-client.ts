import { StandardResponse } from '@/types/frontend-api';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

// Note: API_BASE_URL not used - requests go through Next.js API routes

/**
 * Custom error class for API errors with context for debugging
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public errors?: unknown[],
        public traceId?: string,
        public endpoint?: string,
        public method?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }

    /**
     * Create a detailed error message for logging
     */
    toDetailedString(): string {
        const parts = [`[${this.statusCode}] ${this.message}`];
        if (this.endpoint) parts.push(`Endpoint: ${this.endpoint}`);
        if (this.method) parts.push(`Method: ${this.method}`);
        if (this.traceId) parts.push(`TraceId: ${this.traceId}`);
        return parts.join(' | ');
    }
}

/**
 * Enhanced API fetch wrapper with StandardResponse handling
 * 
 * Features:
 * - Automatic credentials inclusion (for HttpOnly cookies)
 * - Automatic tenant-slug header inclusion from cookies
 * - Handles StandardResponse format
 * - 401 unauthorized handling with event dispatch
 * - Error extraction and formatting
 * 
 * @param endpoint - API endpoint (e.g., '/auth/login')
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export async function apiClient<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    // Read tenant context from cookies (set by middleware)
    let tenantSlug, tenantId;
    try {
        tenantSlug = Cookies.get('tenant-slug');
        tenantId = Cookies.get('tenant-id');
    } catch (e) {
        console.warn('[ApiClient] Failed to read cookies:', e);
    }

    // Ensure credentials are included for cookie-based auth
    const config: RequestInit = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(tenantSlug && { 'x-tenant-slug': tenantSlug }),
            ...(tenantId && { 'x-tenant-id': tenantId }),
            ...options.headers,
        },
    };

    console.log(`[ApiClient] Requesting: ${endpoint}`);

    // Use Next.js API routes (/api/...) which proxy to the backend
    // This ensures proper cookie handling and avoids CORS issues
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;

    try {
        const res = await fetch(url, config);

        // Handle 401 Unauthorized
        if (res.status === 401) {
            // Check if we should suppress the unauthorized event
            const suppressUnauthorized = options.headers &&
                (options.headers as Record<string, string>)['x-suppress-unauthorized'] === 'true';

            // Dispatch global event for unauthorized access ONLY if not suppressed
            if (!suppressUnauthorized && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('unauthorized'));
            }
            // toast.error('Ups, parece que no tienes permiso para acceder a esta página');
            // throw new ApiError('Unauthorized', 401);
            return null as unknown as T;
        }

        // Handle 204 No Content
        if (res.status === 204) {
            return null as T;
        }

        // Parse response as StandardResponse
        const data: StandardResponse<T> = await res.json();
        // Check if the request was successful
        if (!data?.success) {
            throw new ApiError(
                data.message || 'Request failed',
                data.statusCode,
                data.errors,
                data.meta?.traceId
            );
        }

        // Return the actual data payload
        return data.data as T;
    } catch (error) {
        // Re-throw ApiError as-is
        if (error instanceof ApiError) {
            throw error;
        }

        // Network or parsing errors
        if (error instanceof Error) {
            throw new ApiError(error.message, 500);
        }

        // Unknown error
        throw new ApiError('An unexpected error occurred', 500);
    }
}

/**
 * Legacy apiFetch for backward compatibility
 * Consider migrating to apiClient for new code
 */
export async function apiFetch(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, { ...init, credentials: 'include' });

    if (res.status === 401) {
        try {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('unauthorized'));
            }
        } catch {
            // ignore
        }
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body?.error || res.statusText || 'Request failed';
        const e = new Error(err) as Error & { status?: number };
        e.status = res.status;
        throw e;
    }

    return res;
}

/**
 * Helper functions for common HTTP methods
 */
export const api = {
    get: <T = unknown>(endpoint: string, options?: RequestInit) =>
        apiClient<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
        apiClient<T>(endpoint, { ...options, method: 'DELETE' }),

    patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        }),
};
