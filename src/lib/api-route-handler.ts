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

import type { StandardResponse } from "@/types/frontend-api";
import { type HttpMethod, serverBackendFetch } from "./backend-api";
import { type LogContext, logger } from "./logger";
import { extractTokenFromRequest } from "./server-auth";

// ============================================================================
// Types
// ============================================================================

/**
 * `req` is intentionally loose: the temporary Next route files still hand a
 * `NextRequest` (with `nextUrl`) to the legacy factories, while Start passes a
 * plain Web `Request`. Under Start only `Request` APIs may be used.
 */
export type EndpointResolver =
    | string
    | ((req: any, params?: Record<string, string>) => string);

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
 * Creates a handler for the common pattern: List Data + Statistics
 * Fetches from two endpoints in parallel and merges the results.
 */
export function createListWithStatsHandler(
    listEndpoint: EndpointResolver,
    statsEndpoint: string,
    transform?: (data: any) => any,
) {
    return async (req: Request, context?: RouteContext): Promise<Response> => {
        const startTime = Date.now();
        let logContext: LogContext | null = null;

        try {
            const token = extractTokenFromRequest(req);
            const params = context?.params ? await context.params : undefined;
            const resolvedListEndpoint = await resolveEndpoint(
                { method: "GET", endpoint: listEndpoint },
                req,
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

            // Merge results
            const mergedResult = {
                success: true,
                data: finalData,
                users: finalData, // Backward compatibility for some components
                stats: statsResult.success
                    ? (statsResult as { data?: unknown }).data
                    : null,
                pagination: (listResult as { pagination?: unknown })
                    .pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: Array.isArray(finalData) ? finalData.length : 0,
                    itemsPerPage: Array.isArray(finalData)
                        ? finalData.length
                        : 10,
                },
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

export default createRouteHandler;
