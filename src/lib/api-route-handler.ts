/**
 * API Route Handler - Wrapper unificado para rutas API proxy
 * 
 * Reduce código duplicado en las rutas /app/api/** 
 * y proporciona logging automático con trace IDs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromRequest } from './server-auth';
import { backendFetch, ApiResponse, HttpMethod } from './backend-api';
import { logger, LogContext } from './logger';

// ============================================================================
// Types
// ============================================================================

export type EndpointResolver = string | ((req: NextRequest, params?: Record<string, string>) => string);

export interface RouteConfig {
    /** HTTP method for this route */
    method: HttpMethod;
    /** Static endpoint string or function to build dynamic endpoint */
    endpoint: EndpointResolver;
    /** Success status code (default: 200 for GET, 201 for POST) */
    successStatus?: number;
    /** Whether to include query params in the endpoint (for GET requests) */
    includeQueryParams?: boolean;
}

export interface RouteContext {
    params: Promise<Record<string, string>>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Resolve endpoint from config, supporting dynamic endpoints
 */
const resolveEndpoint = async (
    config: RouteConfig,
    req: NextRequest,
    context?: RouteContext
): Promise<string> => {
    const params = context?.params ? await context.params : undefined;

    let endpoint = typeof config.endpoint === 'function'
        ? config.endpoint(req, params)
        : config.endpoint;

    // Append query params for GET requests if configured
    if (config.includeQueryParams !== false && config.method === 'GET') {
        const { searchParams } = new URL(req.url);
        const queryString = searchParams.toString();
        if (queryString) {
            endpoint += endpoint.includes('?') ? `&${queryString}` : `?${queryString}`;
        }
    }

    return endpoint;
};

/**
 * Get default success status based on method
 */
const getSuccessStatus = (config: RouteConfig): number => {
    if (config.successStatus !== undefined) {
        return config.successStatus;
    }
    return config.method === 'POST' ? 201 : 200;
};

/**
 * Parse request body for mutation methods
 */
const parseBody = async (req: NextRequest, method: HttpMethod): Promise<unknown | undefined> => {
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            return await req.json();
        } catch {
            return undefined;
        }
    }
    return undefined;
};

/**
 * Create standardized error response
 */
const createErrorResponse = (
    message: string,
    statusCode: number,
    traceId: string
): NextResponse => {
    return NextResponse.json(
        {
            success: false,
            statusCode,
            message,
            meta: { traceId, timestamp: new Date().toISOString() }
        },
        { status: statusCode }
    );
};

// ============================================================================
// Main Handler Factory
// ============================================================================

/**
 * Creates a route handler with automatic logging, error handling, and token extraction
 * 
 * @example
 * // Simple GET endpoint
 * export const GET = createRouteHandler({
 *     method: 'GET',
 *     endpoint: '/roles'
 * });
 * 
 * @example
 * // Dynamic endpoint with params
 * export const GET = createRouteHandler({
 *     method: 'GET',
 *     endpoint: (req, params) => `/roles/${params?.id}`
 * });
 * 
 * @example
 * // POST with custom success status
 * export const POST = createRouteHandler({
 *     method: 'POST',
 *     endpoint: '/roles',
 *     successStatus: 201
 * });
 */
export function createRouteHandler(config: RouteConfig) {
    return async (req: NextRequest, context?: RouteContext): Promise<NextResponse> => {
        const startTime = Date.now();
        let logContext: LogContext | null = null;

        try {
            // Extract authentication token
            const token = extractTokenFromRequest(req);

            // Resolve endpoint
            const endpoint = await resolveEndpoint(config, req, context);

            // Parse body for mutation requests
            const body = await parseBody(req, config.method);

            // Create log context
            logContext = logger.createContext(endpoint, config.method, body);

            // Log request start
            logger.info(logContext, `API Request: ${config.method} ${endpoint}`);

            // Make backend request
            const result: ApiResponse = await backendFetch(endpoint, {
                method: config.method,
                body,
                token: token || undefined,
            });

            const duration = Date.now() - startTime;

            // Handle unsuccessful response from backend
            if (!result.success) {
                const updatedContext = logger.withResponse(
                    logContext,
                    result,
                    result.statusCode || 500,
                    duration
                );
                logger.warn(updatedContext, `API Response: Backend returned error`);

                return NextResponse.json(result, {
                    status: result.statusCode || 500
                });
            }

            // Log success
            const successContext = logger.withResponse(
                logContext,
                result.data,
                result.statusCode || 200,
                duration
            );
            logger.info(successContext, `API Response: Success`);

            // Return successful response
            return NextResponse.json(result, {
                status: getSuccessStatus(config)
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const statusCode = (error as { statusCode?: number })?.statusCode || 500;

            // Log error
            if (logContext) {
                const errorContext = logger.withError(logContext, error, duration);
                logger.error(errorContext, `API Error: ${errorMessage}`);
            } else {
                console.error(`[API Error] Unhandled error before context creation:`, error);
            }

            return createErrorResponse(
                errorMessage,
                statusCode,
                logContext?.traceId || 'unknown'
            );
        }
    };
}

// ============================================================================
// Convenience Factories
// ============================================================================

/**
 * Create a simple GET handler
 */
export const createGetHandler = (endpoint: EndpointResolver, options?: Partial<RouteConfig>) =>
    createRouteHandler({ method: 'GET', endpoint, ...options });

/**
 * Create a simple POST handler
 */
export const createPostHandler = (endpoint: EndpointResolver, options?: Partial<RouteConfig>) =>
    createRouteHandler({ method: 'POST', endpoint, successStatus: 201, ...options });

/**
 * Create a simple PUT handler
 */
export const createPutHandler = (endpoint: EndpointResolver, options?: Partial<RouteConfig>) =>
    createRouteHandler({ method: 'PUT', endpoint, ...options });

/**
 * Create a simple DELETE handler
 */
export const createDeleteHandler = (endpoint: EndpointResolver, options?: Partial<RouteConfig>) =>
    createRouteHandler({ method: 'DELETE', endpoint, ...options });

/**
 * Create a simple PATCH handler
 */
export const createPatchHandler = (endpoint: EndpointResolver, options?: Partial<RouteConfig>) =>
    createRouteHandler({ method: 'PATCH', endpoint, ...options });

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
    transform?: (data: any) => any
) {
    return async (req: NextRequest, context?: RouteContext): Promise<NextResponse> => {
        const startTime = Date.now();
        let logContext: LogContext | null = null;

        try {
            const token = extractTokenFromRequest(req);
            const resolvedListEndpoint = await resolveEndpoint(
                { method: 'GET', endpoint: listEndpoint },
                req,
                context
            );

            logContext = logger.createContext(resolvedListEndpoint, 'GET');
            logger.info(logContext, `API Request (List+Stats): ${resolvedListEndpoint} & ${statsEndpoint}`);

            // Fetch both in parallel
            const [listResult, statsResult] = await Promise.all([
                backendFetch(resolvedListEndpoint, { method: 'GET', token: token || undefined }).catch(err => ({ success: false, error: err.message, data: [], statusCode: 500 })),
                backendFetch(statsEndpoint, { method: 'GET', token: token || undefined }).catch(err => ({ success: false, error: err.message, data: null, statusCode: 500 }))
            ]);

            const duration = Date.now() - startTime;

            if (!listResult.success) {
                return NextResponse.json(listResult, { status: (listResult as any).statusCode || 500 });
            }

            // Apply transform if provided
            const finalData = transform && listResult.data ? transform(listResult.data) : listResult.data;

            // Merge results
            const mergedResult = {
                success: true,
                data: finalData,
                users: finalData, // Backward compatibility for some components
                stats: statsResult.success ? (statsResult as any).data : null,
                pagination: (listResult as any).pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: Array.isArray(finalData) ? finalData.length : 0,
                    itemsPerPage: Array.isArray(finalData) ? finalData.length : 10,
                },
                meta: {
                    traceId: logContext.traceId,
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`
                }
            };

            logger.info(logger.withResponse(logContext, mergedResult, 200, duration), `API Response: Success (Merged)`);

            return NextResponse.json(mergedResult);

        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            if (logContext) {
                logger.error(logger.withError(logContext, error, duration), `API Error: ${errorMessage}`);
            }

            return createErrorResponse(
                errorMessage,
                500,
                logContext?.traceId || 'unknown'
            );
        }
    };
}

export default createRouteHandler;
