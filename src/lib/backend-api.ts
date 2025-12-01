/**
 * Centralized Backend API Client
 * Handles all communication with the external backend API
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:4001/api';

/**
 * Ensure the URL has a protocol (http:// or https://)
 */
function ensureProtocol(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `http://${url}`;
}

const BASE_URL = ensureProtocol(BACKEND_API_URL);

export interface BackendFetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    token?: string;
}

export interface BackendResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Make a request to the backend API
 * @param endpoint - API endpoint (e.g., '/categories', '/products/123')
 * @param options - Request options
 * @returns Parsed response or throws error
 */
export async function backendFetch<T = any>(
    endpoint: string,
    options: BackendFetchOptions = {}
): Promise<BackendResponse<T>> {
    const { method = 'GET', body, headers = {}, token } = options;

    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${BASE_URL}${normalizedEndpoint}`;

    const fetchOptions: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        cache: 'no-store',
        credentials: 'include', // Important: include cookies
    };

    // Add token as cookie, not Authorization header
    // The backend expects: req.cookies.token
    if (token) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            'Cookie': `token=${token}`,
        };
    }

    if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body);
    }

    // Debug logging
    console.log(`[backendFetch] ${method} ${url}`);
    console.log(`[backendFetch] Sending token as cookie:`, token ? 'yes' : 'no');
    console.log(`[backendFetch] Headers:`, fetchOptions.headers);

    try {
        const response = await fetch(url, fetchOptions);

        // Handle 204 No Content
        if (response.status === 204) {
            console.log(`[backendFetch] Response: 204 No Content`);
            return { success: true };
        }

        // Parse JSON response
        const data = await response.json();
        console.log(`[backendFetch] Response status:`, response.status);
        console.log(`[backendFetch] Response data:`, data);

        // Return the response with status indication
        if (!response.ok) {
            return {
                success: false,
                error: data.error || data.message || 'Request failed',
                ...data,
            };
        }

        return {
            success: true,
            ...data,
        };
    } catch (error) {
        console.error(`Backend API Error [${method} ${endpoint}]:`, error);
        throw error;
    }
}

/**
 * GET request to backend
 */
export async function backendGet<T = any>(
    endpoint: string,
    token?: string,
    headers?: Record<string, string>
): Promise<BackendResponse<T>> {
    return backendFetch<T>(endpoint, { method: 'GET', token, headers });
}

/**
 * POST request to backend
 */
export async function backendPost<T = any>(
    endpoint: string,
    body: any,
    token?: string,
    headers?: Record<string, string>
): Promise<BackendResponse<T>> {
    return backendFetch<T>(endpoint, { method: 'POST', body, token, headers });
}

/**
 * PUT request to backend
 */
export async function backendPut<T = any>(
    endpoint: string,
    body: any,
    token?: string,
    headers?: Record<string, string>
): Promise<BackendResponse<T>> {
    return backendFetch<T>(endpoint, { method: 'PUT', body, token, headers });
}

/**
 * DELETE request to backend
 */
export async function backendDelete<T = any>(
    endpoint: string,
    token?: string,
    headers?: Record<string, string>
): Promise<BackendResponse<T>> {
    return backendFetch<T>(endpoint, { method: 'DELETE', token, headers });
}

/**
 * Get the configured backend API URL
 */
export function getBackendUrl(): string {
    return BASE_URL;
}
