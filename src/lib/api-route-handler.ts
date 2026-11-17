/**
 * API Route Handler - Wrapper unificado para rutas API proxy
 *
 * Reduce código duplicado en las rutas /api/**
 * y proporciona logging automático con trace IDs.
 *
 * The BFF core is `createBffHandler`: it accepts the Start-style
 * `{ request, params }` context and returns a Web `Response`. The older
 * `(request, context)` factories remain as thin adapters for the still-present
 * Next route files until Task 6 replaces them.
 */

import type { Pagination, StandardResponse } from "@/types/frontend-api";
import {
    type ApiResponse,
    backendFetch,
    backendGet,
    backendPut,
    type HttpMethod,
    serverBackendFetch,
} from "./backend-api";
import { getBackendUrl } from "./backend-url";
import { type LogContext, logger } from "./logger";
import { readJsonResponse } from "./response";
import { extractTokenFromRequest } from "./server-auth";

// ============================================================================
// Types
// ============================================================================

/** Dynamic endpoints receive the Web `Request` and the route params Start
 *  resolved from `$param` file names. Only Web-standard APIs are available. */
export type EndpointResolver =
    | string
    | ((req: Request, params?: Record<string, string>) => string);

export interface RouteConfig {
    /** HTTP method for this route */
    method: HttpMethod;
    /** Static endpoint string or function to build dynamic endpoint */
    endpoint: EndpointResolver;
    /** Success status code (default: 200 for GET, 201 for POST) */
    successStatus?: number;
    /** Whether to include query params in the endpoint (for GET requests) */
    includeQueryParams?: boolean;
    /**
     * Forward the status the backend actually returned instead of the declared
     * `successStatus`. Use it when the BFF must not rewrite the backend's answer:
     * 201/202 from a POST, or 204 from a DELETE. Without it a successful response
     * is flattened to 200 (or 201 for POST), which loses information the caller
     * may depend on.
     */
    passThroughStatus?: boolean;
}

/** The context Start passes to a route/server handler. */
export interface BffContext {
    request: Request;
    params?: Record<string, string>;
}

export type BffHandler = (ctx: BffContext) => Promise<Response>;

/** Next-style context kept only for the legacy route-file adapters. */
export interface RouteContext {
    params: Promise<Record<string, string>> | Record<string, string>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Resolve endpoint from config, supporting dynamic endpoints
 */
const resolveEndpoint = async (
    config: RouteConfig,
    req: Request,
    params?: Record<string, string>,
): Promise<string> => {
    let endpoint =
        typeof config.endpoint === "function"
            ? config.endpoint(req, params)
            : config.endpoint;

    // Append query params for GET requests if configured
    if (config.includeQueryParams !== false && config.method === "GET") {
        const { searchParams } = new URL(req.url);
        const queryString = searchParams.toString();
        if (queryString) {
            endpoint += endpoint.includes("?")
                ? `&${queryString}`
                : `?${queryString}`;
        }
    }

    return endpoint;
};

/** Get default success status based on method */
const getSuccessStatus = (config: RouteConfig): number => {
    if (config.successStatus !== undefined) {
        return config.successStatus;
    }
    return config.method === "POST" ? 201 : 200;
};

/** Parse request body for mutation methods */
const parseBody = async (
    req: Request,
    method: HttpMethod,
): Promise<unknown | undefined> => {
    if (["POST", "PUT", "PATCH"].includes(method)) {
        try {
            return await req.json();
        } catch {
            return undefined;
        }
    }
    return undefined;
};

/**
 * Create a standardized error response for a locally thrown error (one that
 * carried no backend envelope). `errors` is always present: its codes are the
 * only stable, machine-readable part of the contract, and the client translates
 * them and never shows the English `message`.
 */
const createErrorResponse = (
    message: string,
    statusCode: number,
    traceId: string,
    errors: unknown[] = [],
): Response => {
    // Response.json() throws for body-less statuses (204/205/304). An error
    // must not turn into a second, opaque failure.
    if ([204, 205, 304].includes(statusCode)) {
        return new Response(null, { status: statusCode });
    }
    return Response.json(
        {
            success: false,
            statusCode,
            message,
            errors,
            meta: { traceId, timestamp: new Date().toISOString() },
        },
        { status: statusCode },
    );
};

/** The codes carried by a thrown error, when the backend sent any. */
const codesFromError = (error: unknown): unknown[] => {
    if (!error || typeof error !== "object") return [];
    const response = (error as { response?: { errors?: unknown } }).response;
    if (Array.isArray(response?.errors)) return response.errors;
    if (Array.isArray(error)) return error;
    return [];
};

/** A backend envelope carried by a thrown error must be forwarded verbatim. */
const envelopeFromError = (error: unknown): StandardResponse | null => {
    if (!error || typeof error !== "object") return null;
    const response = (error as { response?: unknown }).response;
    if (!response || typeof response !== "object") return null;
    const envelope = response as Partial<StandardResponse>;
    if (typeof envelope.success !== "boolean") return null;
    return envelope as StandardResponse;
};

// ============================================================================
// Main Handler Factory
// ============================================================================

/**
 * Creates a BFF handler with automatic logging, error handling and token
 * extraction. The returned function is the shape Start route handlers expect:
 *
 * ```ts
 * export const server = {
 *   GET: createBffHandler("GET", "/products"),
 * };
 * // -> (ctx: { request, params }) => Promise<Response>
 * ```
 */
export function createBffHandler(
    method: HttpMethod,
    endpoint: EndpointResolver,
    config: Partial<RouteConfig> = {},
): BffHandler {
    const routeConfig: RouteConfig = { method, endpoint, ...config };

    return async ({ request, params }: BffContext): Promise<Response> => {
        const startTime = Date.now();
        let logContext: LogContext | null = null;

        try {
            const token = extractTokenFromRequest(request);
            const resolvedEndpoint = await resolveEndpoint(
                routeConfig,
                request,
                params,
            );
            const body = await parseBody(request, method);

            logContext = logger.createContext(resolvedEndpoint, method, body);
            logger.info(
                logContext,
                `API Request: ${method} ${resolvedEndpoint}`,
            );

            const result = await serverBackendFetch<StandardResponse | null>(
                resolvedEndpoint,
                {
                    method,
                    body,
                    token: token || undefined,
                },
            );

            const duration = Date.now() - startTime;

            // 204 No Content: the body was never parsed, so there is nothing
            // to wrap. Forward the empty status instead of building an envelope.
            if (result === null) {
                return new Response(null, { status: 204 });
            }

            if (!result.success) {
                logger.warn(
                    logger.withResponse(
                        logContext,
                        result,
                        result.statusCode || 500,
                        duration,
                    ),
                    `API Response: Backend returned error`,
                );
                // Forward the backend envelope untouched: status, errors,
                // pagination and meta.traceId are all part of the contract.
                return Response.json(result, {
                    status: result.statusCode || 500,
                });
            }

            const successContext = logger.withResponse(
                logContext,
                result.data,
                result.statusCode || 200,
                duration,
            );
            logger.info(successContext, `API Response: Success`);

            const declaredStatus = getSuccessStatus(routeConfig);
            const successStatus = config.passThroughStatus
                ? (result.statusCode ?? declaredStatus)
                : declaredStatus;

            if (successStatus === 204 || successStatus === 304) {
                return new Response(null, { status: successStatus });
            }
            return Response.json(result, { status: successStatus });
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage =
                error instanceof Error ? error.message : "Error desconocido";
            const statusCode =
                (error as { statusCode?: number })?.statusCode || 500;

            if (logContext) {
                logger.error(
                    logger.withError(logContext, error, duration),
                    `API Error: ${errorMessage}`,
                );
            } else {
                console.error(
                    `[API Error] Unhandled error before context creation:`,
                    error,
                );
            }

            const backendEnvelope = envelopeFromError(error);
            if (backendEnvelope) {
                return Response.json(backendEnvelope, {
                    status: backendEnvelope.statusCode || statusCode,
                });
            }

            return createErrorResponse(
                errorMessage,
                statusCode,
                logContext?.traceId || "unknown",
                codesFromError(error),
            );
        }
    };
}

// ============================================================================
// Legacy factories (for the still-present Next route files)
// ============================================================================

/**
 * Adapter for existing `(req, context)` route handlers. `context.params` is a
 * Promise in Next, so await it before handing it to the BFF core.
 */
export function createRouteHandler(config: RouteConfig) {
    const handler = createBffHandler(config.method, config.endpoint, config);
    return async (req: Request, context?: RouteContext): Promise<Response> => {
        const params = context?.params ? await context.params : undefined;
        return handler({ request: req, params });
    };
}

/** Create a simple GET handler */
export const createGetHandler = (
    endpoint: EndpointResolver,
    options?: Partial<RouteConfig>,
) => createRouteHandler({ method: "GET", endpoint, ...options });

/** Create a simple POST handler */
export const createPostHandler = (
    endpoint: EndpointResolver,
    options?: Partial<RouteConfig>,
) =>
    createRouteHandler({
        method: "POST",
        endpoint,
        successStatus: 201,
        ...options,
    });

/** Create a simple PUT handler */
export const createPutHandler = (
    endpoint: EndpointResolver,
    options?: Partial<RouteConfig>,
) => createRouteHandler({ method: "PUT", endpoint, ...options });

/** Create a simple DELETE handler */
export const createDeleteHandler = (
    endpoint: EndpointResolver,
    options?: Partial<RouteConfig>,
) => createRouteHandler({ method: "DELETE", endpoint, ...options });

/** Create a simple PATCH handler */
export const createPatchHandler = (
    endpoint: EndpointResolver,
    options?: Partial<RouteConfig>,
) => createRouteHandler({ method: "PATCH", endpoint, ...options });

// ============================================================================
// Specialized Handlers
// ============================================================================

/**
 * Normalise a backend pagination block to the canonical `Pagination` shape:
 * `{ total, page, limit, totalPages }`. A backend that still sends the legacy
 * `currentPage/totalItems/itemsPerPage` keys is translated; a canonical block
 * is forwarded untouched. The fallback (no backend pagination) is derived from
 * the data length so every list endpoint emits the same four keys.
 */
const normalizePagination = (raw: unknown, data: unknown): Pagination => {
    const length = Array.isArray(data) ? data.length : 0;
    const source = raw && typeof raw === "object" ? raw : {};
    const legacy = source as {
        currentPage?: number;
        totalItems?: number;
        itemsPerPage?: number;
        totalPages?: number;
    };
    const canonical = source as Partial<Pagination>;

    if (
        typeof canonical.total === "number" &&
        typeof canonical.page === "number" &&
        typeof canonical.limit === "number" &&
        typeof canonical.totalPages === "number"
    ) {
        return canonical as Pagination;
    }

    const total = canonical.total ?? legacy.totalItems ?? length;
    const limit = canonical.limit ?? legacy.itemsPerPage ?? (length || 10);
    const page = canonical.page ?? legacy.currentPage ?? 1;
    const totalPages =
        canonical.totalPages ??
        legacy.totalPages ??
        (limit > 0 ? Math.ceil(total / limit) : 1);

    return { total, page, limit, totalPages };
};

/**
 * Creates a Start-compatible handler for the common pattern: List Data +
 * Statistics. Fetches both endpoints in parallel and merges the results.
 */
export function createBffListWithStatsHandler(
    listEndpoint: EndpointResolver,
    statsEndpoint: string,
    transform?: (data: any) => any,
): BffHandler {
    return async ({ request, params }: BffContext): Promise<Response> => {
        const startTime = Date.now();
        let logContext: LogContext | null = null;

        try {
            const token = extractTokenFromRequest(request);
            const resolvedListEndpoint = await resolveEndpoint(
                { method: "GET", endpoint: listEndpoint },
                request,
                params,
            );

            logContext = logger.createContext(resolvedListEndpoint, "GET");
            logger.info(
                logContext,
                `API Request (List+Stats): ${resolvedListEndpoint} & ${statsEndpoint}`,
            );

            // Fetch both in parallel
            const [listResult, statsResult] = await Promise.all([
                serverBackendFetch(resolvedListEndpoint, {
                    method: "GET",
                    token: token || undefined,
                }).catch((err) => ({
                    success: false,
                    error: err.message,
                    data: [] as unknown[],
                    statusCode: 500,
                })),
                serverBackendFetch(statsEndpoint, {
                    method: "GET",
                    token: token || undefined,
                }).catch((err) => ({
                    success: false,
                    error: err.message,
                    data: null,
                    statusCode: 500,
                })),
            ]);

            const duration = Date.now() - startTime;

            if (!listResult.success) {
                return Response.json(listResult, {
                    status:
                        (listResult as { statusCode?: number }).statusCode ||
                        500,
                });
            }

            // Apply transform if provided
            const finalData =
                transform && listResult.data
                    ? transform(listResult.data)
                    : listResult.data;

            const mergedResult = {
                success: true,
                data: finalData,
                users: finalData, // Backward compatibility for some components
                stats: statsResult.success
                    ? (statsResult as { data?: unknown }).data
                    : null,
                pagination: normalizePagination(
                    (listResult as { pagination?: unknown }).pagination,
                    finalData,
                ),
                meta: {
                    traceId: logContext.traceId,
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`,
                },
            };

            logger.info(
                logger.withResponse(logContext, mergedResult, 200, duration),
                `API Response: Success (Merged)`,
            );

            return Response.json(mergedResult);
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage =
                error instanceof Error ? error.message : "Error desconocido";

            if (logContext) {
                logger.error(
                    logger.withError(logContext, error, duration),
                    `API Error: ${errorMessage}`,
                );
            }

            return createErrorResponse(
                errorMessage,
                500,
                logContext?.traceId || "unknown",
                codesFromError(error),
            );
        }
    };
}

/** Legacy `(req, context)` adapter kept for any non-generated caller. */
export function createListWithStatsHandler(
    listEndpoint: EndpointResolver,
    statsEndpoint: string,
    transform?: (data: any) => any,
) {
    const handler = createBffListWithStatsHandler(
        listEndpoint,
        statsEndpoint,
        transform,
    );
    return async (req: Request, context?: RouteContext): Promise<Response> => {
        const params = context?.params ? await context.params : undefined;
        return handler({ request: req, params });
    };
}

// ============================================================================
// Ported route-specific Web handlers
// ============================================================================
//
// These were hand-rolled Next routes (NextRequest/NextResponse, req.nextUrl,
// direct fetch for Set-Cookie forwarding). They are ported to Web standards and
// exposed under `webBffHandlers` so the generator can reference them by key.
// They keep three invariants from the controller rulings: tenant headers win
// over cookies, multi-valued Set-Cookie survives, and the backend envelope /
// status / errors are forwarded verbatim.

const DEFAULT_TENANT_ID =
    process.env.NEXT_PUBLIC_DEFAULT_TENANT ||
    "default-tenant-00000000-0000-0000-0000-000000000001";

const parseRequestCookies = (request: Request): Record<string, string> => {
    const jar = request.headers.get("cookie") ?? "";
    const cookies: Record<string, string> = {};
    for (const pair of jar.split(";")) {
        const separator = pair.indexOf("=");
        if (separator < 0) continue;
        const name = pair.slice(0, separator).trim();
        if (name)
            cookies[name] = decodeURIComponent(
                pair.slice(separator + 1).trim(),
            );
    }
    return cookies;
};

/** Build backend headers from the Web request only: cookies are forwarded, but
 *  proxy-injected tenant headers take precedence over stale tenant cookies. */
const backendProxyHeaders = (
    request: Request,
    withJson = false,
): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (withJson) headers["Content-Type"] = "application/json";

    const cookie = request.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;

    const cookies = parseRequestCookies(request);
    const slug = request.headers.get("x-tenant-slug") || cookies["tenant-slug"];
    const tenantId = request.headers.get("x-tenant-id") || cookies["tenant-id"];
    if (slug) headers["x-tenant-slug"] = slug;
    if (tenantId && tenantId !== DEFAULT_TENANT_ID) {
        headers["x-tenant-id"] = tenantId;
    }

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "http";
    if (origin && origin !== "null") headers["x-original-origin"] = origin;
    else if (referer) {
        try {
            headers["x-original-origin"] = new URL(referer).origin;
        } catch {
            if (host) headers["x-original-origin"] = `${proto}://${host}`;
        }
    } else if (host) {
        headers["x-original-origin"] = `${proto}://${host}`;
    }

    return headers;
};

const backendUrl = (endpoint: string): string =>
    `${getBackendUrl()}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

/** Build a Response carrying every Set-Cookie the backend sent. Appending (not
 *  joining) keeps multiple cookies distinct through the Node adapter. */
const withBackendCookies = (
    body: unknown,
    status: number,
    response: Response,
    fallback?: string,
): Response => {
    const headers = new Headers({ "content-type": "application/json" });
    const cookies = response.headers.getSetCookie?.() ?? [];
    if (cookies.length === 0) {
        if (fallback) headers.append("set-cookie", fallback);
    } else {
        for (const cookie of cookies) {
            // Browsers reject Domain=.localhost; keep the auth cookie host-only.
            headers.append(
                "set-cookie",
                cookie.replace(/;\s*Domain=(?:\.)?localhost/gi, ""),
            );
        }
    }
    if ([204, 205, 304].includes(status)) {
        headers.delete("content-type");
        return new Response(null, { status, headers });
    }
    return Response.json(body, { status, headers });
};

const DELETE_COOKIE =
    "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax";

const webBffHandlers: Record<string, BffHandler> = {
    // ---- auth --------------------------------------------------------------
    "POST /api/auth/login": async ({ request }) => {
        const startTime = Date.now();
        const logContext = logger.createContext("/auth/login", "POST");
        try {
            const body = await request.json();
            logger.info(logContext, "Auth Request: Login attempt");
            const response = await fetch(backendUrl("/auth/login"), {
                method: "POST",
                headers: {
                    ...backendProxyHeaders(request, true),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                cache: "no-store",
            });
            const data =
                response.status === 204
                    ? {
                          success: true,
                          statusCode: response.status,
                          message: "Sesión iniciada",
                      }
                    : await response.json().catch(() => ({
                          success: response.ok,
                          statusCode: response.status,
                          message: response.ok
                              ? "Sesión iniciada"
                              : "Error al iniciar sesión",
                      }));
            const duration = Date.now() - startTime;
            if (!response.ok) {
                logger.warn(
                    logger.withResponse(
                        logContext,
                        data,
                        response.status,
                        duration,
                    ),
                    "Auth Response: Login failed",
                );
            } else {
                logger.info(
                    logger.withResponse(
                        logContext,
                        { success: true },
                        response.status,
                        duration,
                    ),
                    "Auth Response: Login successful",
                );
            }
            return withBackendCookies(data, response.status, response);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Error desconocido al iniciar sesión";
            logger.error(
                logger.withError(logContext, error, Date.now() - startTime),
                `Auth Error: ${message}`,
            );
            return createErrorResponse(
                "Error al iniciar sesión",
                500,
                logContext.traceId,
            );
        }
    },

    "POST /api/auth/register": async ({ request }) => {
        const startTime = Date.now();
        const logContext = logger.createContext("/auth/signup", "POST");
        try {
            const body = await request.json();
            logger.info(logContext, "Auth Request: Signup attempt");
            const response = await fetch(backendUrl("/auth/signup"), {
                method: "POST",
                headers: {
                    ...backendProxyHeaders(request, true),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                cache: "no-store",
            });
            const data = await response.json();
            const duration = Date.now() - startTime;
            logger.info(
                logger.withResponse(
                    logContext,
                    { success: true },
                    response.status,
                    duration,
                ),
                "Auth Response: Signup complete",
            );
            return withBackendCookies(data, response.status, response);
        } catch (error: unknown) {
            logger.error(
                logger.withError(logContext, error, Date.now() - startTime),
                `Auth Error: ${error instanceof Error ? error.message : "unknown"}`,
            );
            return createErrorResponse(
                "Error al registrarse",
                500,
                logContext.traceId,
            );
        }
    },

    "POST /api/auth/logout": async ({ request }) => {
        const startTime = Date.now();
        const logContext = logger.createContext("/auth/logout", "POST");
        try {
            logger.info(logContext, "Auth Request: Logout attempt");
            const response = await fetch(backendUrl("/auth/logout"), {
                method: "POST",
                headers: backendProxyHeaders(request),
                cache: "no-store",
            });
            const data = await readJsonResponse(response);
            logger.info(
                logger.withResponse(
                    logContext,
                    { success: true },
                    response.status,
                    Date.now() - startTime,
                ),
                "Auth Response: Logout successful",
            );
            return withBackendCookies(
                data,
                response.status,
                response,
                DELETE_COOKIE,
            );
        } catch (error: unknown) {
            logger.error(
                logger.withError(logContext, error, Date.now() - startTime),
                `Auth Error: ${error instanceof Error ? error.message : "unknown"}`,
            );
            return Response.json(
                { success: true, message: "Sesión cerrada localmente" },
                { status: 200, headers: { "Set-Cookie": DELETE_COOKIE } },
            );
        }
    },

    "GET /api/auth/me": async ({ request }) => {
        try {
            const response = await fetch(backendUrl("/auth/validate"), {
                method: "GET",
                headers: backendProxyHeaders(request),
                cache: "no-store",
            });
            const data = await readJsonResponse(response);
            return Response.json(data, { status: response.status });
        } catch (error) {
            console.error("Error validating session:", error);
            return createErrorResponse(
                "Error al validar la sesión",
                401,
                "unknown",
            );
        }
    },

    "GET /api/auth/validate": async ({ request }) => {
        const startTime = Date.now();
        const logContext = logger.createContext("/auth/validate", "GET");
        try {
            const token = extractTokenFromRequest(request);
            if (!token) {
                return createErrorResponse(
                    "No se encontró un token de sesión",
                    401,
                    logContext.traceId,
                );
            }
            logger.info(logContext, "Auth Request: Validating session");
            let result = await backendGet("/auth/validate", token);
            if (!result.success && result.statusCode === 404) {
                const resultMe = await backendGet("/auth/me", token);
                if (!resultMe.success) {
                    return Response.json(resultMe, {
                        status: resultMe.statusCode || 401,
                    });
                }
                result = { ...resultMe, user: resultMe.data } as ApiResponse;
            }
            if (!result.success) {
                return Response.json(result, {
                    status: result.statusCode || 401,
                });
            }
            logger.info(
                logger.withResponse(
                    logContext,
                    { success: true },
                    200,
                    Date.now() - startTime,
                ),
                "Auth Response: Session valid",
            );
            return Response.json(result);
        } catch (error: any) {
            logger.error(
                logger.withError(logContext, error, Date.now() - startTime),
                `Auth Error: ${error.message}`,
            );
            return Response.json(
                {
                    success: false,
                    error: error.message || "Error al validar la sesión",
                },
                { status: error.statusCode || error.status || 500 },
            );
        }
    },

    // ---- profile -----------------------------------------------------------
    "GET /api/profile": async ({ request }) => {
        try {
            const response = await fetch(backendUrl("/auth/validate"), {
                method: "GET",
                headers: backendProxyHeaders(request),
                cache: "no-store",
            });
            const data = await readJsonResponse(response);
            return Response.json(data, { status: response.status });
        } catch (error) {
            console.error("Error fetching profile:", error);
            return createErrorResponse(
                "Error al obtener el perfil",
                401,
                "unknown",
            );
        }
    },

    "PUT /api/profile": async ({ request }) => {
        try {
            const body = await request.json();
            const validateResponse = await fetch(backendUrl("/auth/validate"), {
                method: "GET",
                headers: backendProxyHeaders(request),
                cache: "no-store",
            });
            const validateData = await readJsonResponse<{
                success?: boolean;
                data?: { user?: { id?: string } };
            }>(validateResponse);
            if (!validateData.success || !validateData.data?.user?.id) {
                return Response.json(
                    { error: "Unauthorized" },
                    { status: 401 },
                );
            }
            const response = await fetch(
                backendUrl(`/users/${validateData.data.user.id}`),
                {
                    method: "PUT",
                    headers: backendProxyHeaders(request, true),
                    body: JSON.stringify(body),
                    cache: "no-store",
                },
            );
            const data = await readJsonResponse(response);
            return Response.json(data, { status: response.status });
        } catch (error) {
            console.error("Error updating profile:", error);
            return createErrorResponse(
                "Error al actualizar el perfil",
                500,
                "unknown",
            );
        }
    },

    // ---- sliders / appointments --------------------------------------------
    "GET /api/sliders": async ({ request }) => {
        try {
            const response = await fetch(backendUrl("/slide"), {
                cache: "no-store",
                headers: backendProxyHeaders(request),
            });
            if (!response.ok) {
                console.error(
                    `Failed to fetch sliders from backend: ${response.status}`,
                );
                return Response.json({ sliders: [] });
            }
            const data = await response.json();
            return Response.json({ sliders: data.data || [] });
        } catch (error) {
            console.error("Error fetching sliders:", error);
            return Response.json({ sliders: [] });
        }
    },

    "GET /api/appointments/availability": async ({ request }) => {
        const query = new URL(request.url).search;
        try {
            const response = await fetch(
                backendUrl(`/appointments/availability${query}`),
                {
                    method: "GET",
                    headers: backendProxyHeaders(request),
                    cache: "no-store",
                },
            );
            const data = await response.json();
            return Response.json(data, { status: response.status });
        } catch (error: any) {
            console.error("Error fetching availability:", error);
            return createErrorResponse(
                `Backend error: ${error?.message ?? "Internal Server Error"}`,
                500,
                "unknown",
            );
        }
    },

    // ---- order statuses / user orders --------------------------------------
    "GET /api/admin/orders/statuses": async ({ request }) => {
        try {
            const token = extractTokenFromRequest(request) || undefined;
            const result = await backendGet("/order/statuses", token);
            return Response.json(result, {
                status: result.success ? 200 : 500,
            });
        } catch (error) {
            console.error("Error fetching order statuses:", error);
            return createErrorResponse(
                "Error al obtener los estados de los pedidos",
                500,
                "unknown",
            );
        }
    },

    "GET /api/orders/statuses": async ({ request }) => {
        try {
            const token = extractTokenFromRequest(request) || undefined;
            const result = await backendGet("/order/statuses", token);
            return Response.json(result, {
                status: result.success ? 200 : 500,
            });
        } catch (error) {
            console.error("Error fetching order statuses:", error);
            return createErrorResponse(
                "Error al obtener los estados de los pedidos",
                500,
                "unknown",
            );
        }
    },

    "GET /api/orders/user": async ({ request }) => {
        try {
            const token = extractTokenFromRequest(request) || undefined;
            const search = new URL(request.url).search;
            const result = await backendGet(
                `/order/getOrderByUser${search}`,
                token,
            );
            return Response.json(result, {
                status: result.success ? 200 : 500,
            });
        } catch (error) {
            console.error("Error fetching user orders:", error);
            return createErrorResponse(
                "Error al obtener los pedidos del usuario",
                500,
                "unknown",
            );
        }
    },

    // ---- admin users / stats -----------------------------------------------
    "PUT /api/admin/users": async ({ request }) => {
        try {
            const body = await request.json();
            const { userId, ...updateData } = body;
            if (!userId) {
                return createErrorResponse(
                    "El ID de usuario es obligatorio",
                    400,
                    "unknown",
                );
            }
            const token = extractTokenFromRequest(request) || undefined;
            const result = await backendPut(
                `/users/${userId}`,
                updateData,
                token,
            );
            return Response.json(result, { status: result.statusCode || 200 });
        } catch (error: any) {
            return createErrorResponse(
                error?.message ?? "Error desconocido",
                500,
                "unknown",
            );
        }
    },

    "GET /api/admin/stats/overview": async ({ request }) => {
        const startTime = Date.now();
        const logContext = logger.createContext("/admin/stats/overview", "GET");
        const token = extractTokenFromRequest(request) || undefined;
        try {
            const [
                usersRes,
                productsRes,
                ordersRes,
                couponsRes,
                slidersRes,
                bannersRes,
                categoriesRes,
            ] = await Promise.all([
                backendFetch("/users/stats/summary", {
                    method: "GET",
                    token,
                }).catch(() => ({
                    success: false,
                    data: { totalUsers: 0, adminUsers: 0, regularUsers: 0 },
                })),
                backendFetch("/products/stats/summary", {
                    method: "GET",
                    token,
                }).catch(() => ({
                    success: false,
                    data: {
                        totalProducts: 0,
                        totalValue: 0,
                        lowStockCount: 0,
                        outOfStockCount: 0,
                    },
                })),
                backendFetch("/order/stats", { method: "GET", token }).catch(
                    () => ({
                        success: false,
                        data: { totalOrders: 0, totalRevenue: 0 },
                    }),
                ),
                backendFetch("/coupons/stats", { method: "GET", token }).catch(
                    () => ({
                        success: false,
                        data: {
                            totalCoupons: 0,
                            activeCoupons: 0,
                            usedCoupons: 0,
                        },
                    }),
                ),
                backendFetch("/slide/stats", { method: "GET", token }).catch(
                    () => ({
                        success: false,
                        data: {
                            totalSliders: 0,
                            activeSliders: 0,
                            withImages: 0,
                        },
                    }),
                ),
                backendFetch("/banners/stats", { method: "GET", token }).catch(
                    () => ({
                        success: false,
                        data: { totalBanners: 0, activeBanners: 0 },
                    }),
                ),
                backendFetch("/categories/stats", {
                    method: "GET",
                    token,
                }).catch(() => ({
                    success: false,
                    data: { totalCategories: 0, avgProductsPerCategory: 0 },
                })),
            ]);

            const ordersData: any = ordersRes.data || {};
            const ordersCount = ordersData.totalOrders || 0;
            const ordersRevenue = ordersData.totalRevenue || 0;
            const usersData: any = usersRes.data || {};
            const productsData: any = productsRes.data || {};
            const couponsData: any = couponsRes.data || {};
            const slidersData: any = slidersRes.data || {};
            const bannersData: any = bannersRes.data || {};
            const categoriesData: any = categoriesRes.data || {};

            const stats = {
                users: {
                    total: usersData.totalUsers || 0,
                    admins: usersData.adminUsers || 0,
                    regular: usersData.regularUsers || 0,
                },
                products: {
                    total: productsData.totalProducts || 0,
                    totalValue: productsData.totalValue || 0,
                    lowStock: productsData.lowStockCount || 0,
                    outOfStock: productsData.outOfStockCount || 0,
                },
                orders: {
                    total: ordersCount,
                    revenue: ordersRevenue,
                    avgOrderValue:
                        ordersCount > 0 ? ordersRevenue / ordersCount : 0,
                },
                coupons: {
                    total: couponsData.totalCoupons || 0,
                    active: couponsData.activeCoupons || 0,
                    used: couponsData.usedCoupons || 0,
                },
                sliders: {
                    total: slidersData.totalSliders || 0,
                    active: slidersData.activeSliders || 0,
                    withImages: slidersData.withImages || 0,
                },
                banners: {
                    total: bannersData.totalBanners || 0,
                    active: bannersData.activeBanners || 0,
                },
                categories: {
                    total: categoriesData.totalCategories || 0,
                    avgProducts: categoriesData.avgProductsPerCategory || 0,
                },
            };

            const result = { success: true, data: stats };
            logger.info(
                logger.withResponse(
                    logContext,
                    result,
                    200,
                    Date.now() - startTime,
                ),
                "API Response: Success (Stats Aggregated)",
            );
            return Response.json(result);
        } catch (error: any) {
            logger.error(
                logger.withError(logContext, error, Date.now() - startTime),
                `API Error: ${error.message}`,
            );
            return Response.json(
                {
                    success: false,
                    message: "Error al obtener las analíticas",
                    meta: { traceId: logContext.traceId },
                },
                { status: 500 },
            );
        }
    },

    // ---- revalidation webhook ----------------------------------------------
    "POST /api/revalidate": async ({ request }) => {
        const secret = process.env.REVALIDATE_SECRET;
        if (secret && request.headers.get("x-revalidate-secret") !== secret) {
            return Response.json({ ok: false }, { status: 401 });
        }
        const body = await request.json().catch(() => null);
        const tenantId = body?.entry?.tenantId ?? body?.tenantId;
        if (typeof tenantId === "string" && tenantId) {
            // TanStack Start has no next/cache revalidateTag. The HTTP contract
            // (auth check, payload validation, response shape) is preserved;
            // cache invalidation is wired to the server entry in a later task.
            console.info(`[revalidate] content:${tenantId}`);
            return Response.json({
                ok: true,
                revalidated: `content:${tenantId}`,
            });
        }
        return Response.json(
            { ok: false, reason: "falta tenantId en el payload" },
            { status: 400 },
        );
    },
};

export { webBffHandlers };

export default createRouteHandler;
