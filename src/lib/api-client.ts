import { StandardResponse } from '@/types/frontend-api';

/**
 * Base API URL - defaults to localhost in development
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public errors?: any[],
        public traceId?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Enhanced API fetch wrapper with StandardResponse handling
 * 
 * Features:
 * - Automatic credentials inclusion (for HttpOnly cookies)
 * - Handles StandardResponse format
 * - 401 unauthorized handling with event dispatch
 * - Error extraction and formatting
 * 
 * @param endpoint - API endpoint (e.g., '/auth/login')
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export async function apiClient<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    // Ensure credentials are included for cookie-based auth
    const config: RequestInit = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
        const res = await fetch(url, config);

        // Handle 401 Unauthorized
        if (res.status === 401) {
            // Dispatch global event for unauthorized access
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('unauthorized'));
            }
            throw new ApiError('Unauthorized', 401);
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
    get: <T = any>(endpoint: string, options?: RequestInit) =>
        apiClient<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T = any>(endpoint: string, options?: RequestInit) =>
        apiClient<T>(endpoint, { ...options, method: 'DELETE' }),

    patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        }),
};
