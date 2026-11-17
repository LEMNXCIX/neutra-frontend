/**
 * Backend API Client
 * Centralized, type-safe client for external backend communication.
 *
 * Request state (cookie jar, tenant headers) is read from TanStack Start's
 * server utilities, never from next/headers.
 */

import {
    getCookie,
    getRequest,
    getRequestHeader,
} from "@tanstack/react-start/server";
import type { StandardResponse } from "@/types/frontend-api";
import { getBackendUrl } from "./backend-url";

// ============================================================================
// Configuration
// ============================================================================

const TOKEN_COOKIE_NAME = "token";

/**
 * Header names whose values are credentials or session material. They are
 * redacted before anything reaches a log sink.
 */
const SENSITIVE_HEADERS = new Set(["cookie", "authorization", "set-cookie"]);

/** The structural shape of Next's fetch `next` option, without importing Next. */
export interface FetchCacheConfig {
    revalidate?: number | false;
    tags?: string[];
}

/**
 * Derive the public origin of the incoming request so the backend can build
 * absolute links (receipts, password-reset URLs) against the tenant host rather
 * than against its own internal address. Lives here, next to the tenant
 * forwarding, so every BFF call carries it instead of only the routes that
 * happened to remember getProxyHeaders.
 */
const resolveOriginalOrigin = (h: Headers): string | null => {
    const origin = h.get("origin");
    if (origin && origin !== "null") return origin;

    const referer = h.get("referer");
    if (referer) {
        try {
            return new URL(referer).origin;
        } catch {
            // Malformed referer: fall through to host-based reconstruction.
        }
    }

    const host = h.get("host");
    if (!host) return null;
    const proto = h.get("x-forwarded-proto") || "http";
    return `${proto}://${host}`;
};

/**
 * Redact credential-bearing headers so request/response logging can never leak a
 * JWT. Explicit opt-in via LOG_HEADERS is not enough of a guard on its own: a
 * single log line is enough to persist a session in a log aggregator.
 */
const redactHeaders = (
    headers: Record<string, string>,
): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        out[key] = SENSITIVE_HEADERS.has(key.toLowerCase())
            ? "[redacted]"
            : value;
    }
    return out;
};

// ============================================================================
// Types
// ============================================================================

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiRequestConfig {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    token?: string;
    timeout?: number;
    cache?: RequestCache;
    next?: FetchCacheConfig;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    statusCode?: number;
    errors?: Array<{
        code: string;
        message: string;
        field?: string;
        domain?: string;
        metadata?: unknown;
    }>;
    pagination?: StandardResponse["pagination"];
    meta?: StandardResponse["meta"];
}

export interface ApiError extends Error {
    statusCode?: number;
    response?: ApiResponse;
}

/** `RequestInit` plus the bearer token and JSON body the BFF passes along. */
export type ServerFetchInit = Omit<RequestInit, "body"> & {
    body?: unknown;
    token?: string;
};

// ============================================================================
// Error Handling
// ============================================================================

class BackendApiError extends Error implements ApiError {
    statusCode?: number;
    response?: ApiResponse;

    constructor(message: string, statusCode?: number, response?: ApiResponse) {
        super(message);
        this.name = "BackendApiError";
        this.statusCode = statusCode;
        this.response = response;
    }
}

// ============================================================================
// Shared request headers
// ============================================================================

/**
 * Build the headers every backend call carries.
 *
 * - the whole incoming cookie jar is forwarded (not just `token`);
 * - proxy-injected `x-tenant-slug` / `x-tenant-id` headers win over the
 *   tenant cookies, which can be stale after a visit to another subdomain;
 * - the default tenant id is dropped so it cannot override a resolved slug.
 */
const buildRequestHeaders = (
    explicit: Record<string, string> | undefined,
    token: string | undefined,
): { headers: Record<string, string>; forwardedCookieJar: boolean } => {
    const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...explicit,
    };

    let forwardedCookieJar = false;
    try {
        const req = getRequest();
        const h = req?.headers;
        const cookie = h?.get("cookie");

        if (cookie) {
            requestHeaders.Cookie = cookie;
            forwardedCookieJar = true;
        }

        if (h) {
            // Header precedence: the proxy sets these for THIS request, so a
            // stale client cookie must never win.
            const slug =
                getRequestHeader("x-tenant-slug") ??
                h.get("x-tenant-slug") ??
                undefined;
            const headerTenantId =
                getRequestHeader("x-tenant-id") ??
                h.get("x-tenant-id") ??
                undefined;
            const tenantSlug = slug || getCookie("tenant-slug");
            const tenantId = headerTenantId || getCookie("tenant-id");

            if (tenantSlug) {
                requestHeaders["x-tenant-slug"] = tenantSlug;
            }

            const defaultTenantId =
                process.env.NEXT_PUBLIC_DEFAULT_TENANT ||
                "default-tenant-00000000-0000-0000-0000-000000000001";
            if (tenantId && tenantId !== defaultTenantId) {
                requestHeaders["x-tenant-id"] = tenantId;
            }

            const originalOrigin = resolveOriginalOrigin(h);
            if (originalOrigin) {
                requestHeaders["x-original-origin"] = originalOrigin;
            }
        }
    } catch (_e) {
        // No Start request scope (static generation, scripts, unit tests).
    }

    // Outside a request scope, send the bare token so the call is still
    // authenticated. Logged, because a request that authenticates differently
    // from the rest deserves to be visible.
    if (token && !forwardedCookieJar) {
        requestHeaders.Cookie = `${TOKEN_COOKIE_NAME}=${token}`;
        console.warn(
            "[BackendApi] No incoming cookie jar; sending token-only Cookie header.",
        );
    }

    return { headers: requestHeaders, forwardedCookieJar };
};

const normalizeEndpoint = (endpoint: string): string =>
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

// ============================================================================
// Core Client (legacy helper API)
// ============================================================================

/**
 * Make HTTP request to backend API
 */
async function request<T = unknown>(
    endpoint: string,
    config: ApiRequestConfig = {},
): Promise<ApiResponse<T>> {
    const {
        method = "GET",
        body,
        headers = {},
        token,
        timeout = 30000,
        cache,
        next,
    } = config;

    const url = `${getBackendUrl()}${normalizeEndpoint(endpoint)}`;

    if (typeof window === "undefined") {
        console.log(`[BackendApi] ${method} ${url}`);
    }

    const { headers: requestHeaders } = buildRequestHeaders(headers, token);

    // Build fetch options
    const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: "include",
        cache: cache || "no-store",
        next,
    };

    if (typeof window === "undefined" && process.env.LOG_HEADERS === "true") {
        console.log(
            `[BackendApi] Headers:`,
            JSON.stringify(redactHeaders(requestHeaders), null, 2),
        );
    }

    // Add body for mutation requests
    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
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
            const errorMessage =
                data.error ||
                data.message ||
                `Request failed with status ${response.status}`;
            throw new BackendApiError(errorMessage, response.status, {
                success: false,
                error: errorMessage,
                statusCode: response.status,
                ...data,
            });
        }

        if (typeof window === "undefined") {
            console.log(
                `[BackendApi] Response: ${response.status} ${response.statusText}`,
            );
        }

        return {
            success: true,
            statusCode: response.status,
            ...data,
        };
    } catch (error) {
        if (typeof window === "undefined") {
            console.error(`[BackendApi] ERROR:`, error);
        }
        clearTimeout(timeoutId);

        // Re-throw BackendApiError
        if (error instanceof BackendApiError) {
            throw error;
        }

        // Handle abort/timeout
        if (error instanceof Error && error.name === "AbortError") {
            throw new BackendApiError("Request timeout", 408);
        }

        // Handle network errors
        if (error instanceof Error) {
            throw new BackendApiError(`Network error: ${error.message}`, 0, {
                success: false,
                error: error.message,
            });
        }

        throw new BackendApiError("Ocurrió un error desconocido");
    }
}

// ============================================================================
// BFF / loader client — forwards the envelope untouched
// ============================================================================

/**
 * Server-side backend call for BFF route handlers and Start route loaders.
 *
 * Contract (api-neutra-v2 §6):
 * - 204 returns `null` and the body is never parsed;
 * - a successful response returns the backend envelope verbatim — status,
 *   `errors`, `pagination` and `meta.traceId` are not rebuilt;
 * - an unsuccessful response throws `BackendApiError` carrying the verbatim
 *   envelope in `.response` and the HTTP status in `.statusCode`. The BFF
 *   forwards both; it never rewrites the backend's answer.
 */
export async function serverBackendFetch<T = StandardResponse>(
    endpoint: string,
    init: ServerFetchInit = {},
): Promise<T> {
    const { token, body: rawBody, ...fetchInit } = init;
    const url = `${getBackendUrl()}${normalizeEndpoint(endpoint)}`;
    const explicitHeaders = fetchInit.headers
        ? Object.fromEntries(new Headers(fetchInit.headers).entries())
        : undefined;
    const { headers } = buildRequestHeaders(explicitHeaders, token);

    const method = (fetchInit.method as HttpMethod) || "GET";
    let body: BodyInit | undefined;
    if (rawBody != null && ["POST", "PUT", "PATCH"].includes(method)) {
        // A route handler hands over the parsed JSON object.
        body = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(url, {
            ...fetchInit,
            method,
            headers,
            body,
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // 204 No Content has no body to parse.
        if (response.status === 204) {
            return null as T;
        }

        const envelope = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new BackendApiError(
                typeof envelope?.message === "string"
                    ? envelope.message
                    : `Request failed with status ${response.status}`,
                response.status,
                envelope as ApiResponse,
            );
        }

        return envelope as T;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof BackendApiError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
            throw new BackendApiError("Request timeout", 408);
        }
        // Never rewrite the failure: the BFF surfaces the original message and
        // derives the status from an explicit `statusCode` when one exists.
        throw error;
    }
}

// ============================================================================
// HTTP Method Helpers
// ============================================================================

export const get = <T = unknown>(
    endpoint: string,
    token?: string,
    headers?: Record<string, string>,
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: "GET", token, headers });
};

export const post = <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    headers?: Record<string, string>,
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: "POST", body, token, headers });
};

export const put = <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    headers?: Record<string, string>,
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: "PUT", body, token, headers });
};

export const patch = <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    headers?: Record<string, string>,
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: "PATCH", body, token, headers });
};

export const del = <T = unknown>(
    endpoint: string,
    token?: string,
    headers?: Record<string, string>,
): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: "DELETE", token, headers });
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

export { getBackendUrl } from "./backend-url";

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
