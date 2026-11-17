import Cookies from "js-cookie";
import { getBackendUrl } from "@/lib/backend-url";
import type { StandardResponse } from "@/types/frontend-api";

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
        public method?: string,
    ) {
        super(message);
        this.name = "ApiError";
    }

    /**
     * Create a detailed error message for logging
     */
    toDetailedString(): string {
        const parts = [`[${this.statusCode}] ${this.message}`];
        if (this.endpoint) parts.push(`Endpoint: ${this.endpoint}`);
        if (this.method) parts.push(`Method: ${this.method}`);
        if (this.traceId) parts.push(`TraceId: ${this.traceId}`);
        return parts.join(" | ");
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
    options: RequestInit = {},
    includeMeta = false,
): Promise<T> {
    // Read tenant context from cookies
    let tenantSlug: string | undefined,
        tenantId: string | undefined,
        cookieHeader: string | undefined;

    if (typeof window !== "undefined") {
        // Client-side: use js-cookie
        try {
            tenantSlug = Cookies.get("tenant-slug");
            tenantId = Cookies.get("tenant-id");
        } catch (e) {
            console.warn("[ApiClient] Failed to read cookies:", e);
        }
    } else {
        // Server-side: read the Start request context. Imported lazily so a
        // browser bundle never pulls in the server-only module.
        try {
            const { getRequest, getRequestHeader, getCookie } = await import(
                "@tanstack/react-start/server"
            );

            // Prefer the x-tenant-* request headers: the proxy sets them for
            // THIS request (always correct). Cookies can be stale — they're
            // set on the response, so a request that follows a visit to
            // another subdomain still carries the previous tenant's cookie.
            tenantSlug =
                getRequestHeader("x-tenant-slug") || getCookie("tenant-slug");
            tenantId =
                getRequestHeader("x-tenant-id") || getCookie("tenant-id");

            // Forward the whole jar, not just the token cookie.
            cookieHeader = getRequest()?.headers?.get("cookie") ?? undefined;
        } catch (_e) {
            // No Start request scope (static generation, scripts, unit tests).
        }
    }

    // Ensure credentials are included for cookie-based auth
    const config: RequestInit = {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(tenantSlug && { "x-tenant-slug": tenantSlug }),
            ...(tenantId && { "x-tenant-id": tenantId }),
            ...(cookieHeader && { Cookie: cookieHeader }),
            ...options.headers,
        },
    };

    const isServer = typeof window === "undefined";
    // Browser traffic always goes through the BFF at /api, which keeps
    // the backend origin and the session cookie in one place. Server-rendered
    // calls hit the backend directly, because a relative URL does not resolve.
    const baseUrl = isServer ? getBackendUrl() : "/api";

    const url = endpoint.startsWith("http")
        ? endpoint
        : `${baseUrl}${endpoint}`;

    if (process.env.NODE_ENV === "development") {
        if (isServer) {
            console.log(
                `[ApiClient] SERVER REQUEST | url: ${url} | endpoint: ${endpoint} | baseUrl: ${baseUrl}`,
            );
        } else {
            console.log(
                `[ApiClient] CLIENT REQUEST | url: ${url} | endpoint: ${endpoint}`,
            );
        }
    }

    try {
        const res = await fetch(url, config);

        // Handle 401 Unauthorized
        if (res.status === 401) {
            // Check if we should suppress the unauthorized event
            const suppressUnauthorized =
                options.headers &&
                (options.headers as Record<string, string>)[
                    "x-suppress-unauthorized"
                ] === "true";

            // Dispatch global event for unauthorized access ONLY if not suppressed
            if (!suppressUnauthorized && typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("unauthorized"));
            }

            // Try to parse the error response for a meaningful message
            try {
                const errorData: StandardResponse<T> = await res.json();
                throw new ApiError(
                    errorData.message || "Unauthorized",
                    errorData.statusCode || 401,
                    errorData.errors,
                    errorData.meta?.traceId,
                );
            } catch (error) {
                if (error instanceof ApiError) throw error;
                throw new ApiError("Unauthorized", 401);
            }
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
                data.message || "Error en la solicitud",
                data.statusCode,
                data.errors,
                data.meta?.traceId,
            );
        }

        // Return the actual data payload (plus envelope meta if requested)
        return (
            includeMeta ? { data: data.data as T, meta: data.meta } : data.data
        ) as T;
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
        throw new ApiError("Ocurrió un error inesperado", 500);
    }
}

/**
 * Legacy apiFetch for backward compatibility
 * Consider migrating to apiClient for new code
 */
export async function apiFetch(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, { ...init, credentials: "include" });

    if (res.status === 401) {
        try {
            if (
                typeof window !== "undefined" &&
                typeof window.dispatchEvent === "function"
            ) {
                window.dispatchEvent(new CustomEvent("unauthorized"));
            }
        } catch {
            // ignore
        }
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body?.error || res.statusText || "Error en la solicitud";
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
        apiClient<T>(endpoint, { ...options, method: "GET" }),

    /** Like get(), but also returns the envelope meta (e.g. meta.pagination). */
    getWithMeta: <T = unknown>(endpoint: string, options?: RequestInit) =>
        apiClient<{ data: T; meta?: Record<string, any> }>(
            endpoint,
            { ...options, method: "GET" },
            true,
        ),

    post: <T = unknown>(
        endpoint: string,
        body?: unknown,
        options?: RequestInit,
    ) =>
        apiClient<T>(endpoint, {
            ...options,
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T = unknown>(
        endpoint: string,
        body?: unknown,
        options?: RequestInit,
    ) =>
        apiClient<T>(endpoint, {
            ...options,
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
        apiClient<T>(endpoint, { ...options, method: "DELETE" }),

    patch: <T = unknown>(
        endpoint: string,
        body?: unknown,
        options?: RequestInit,
    ) =>
        apiClient<T>(endpoint, {
            ...options,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        }),
};
