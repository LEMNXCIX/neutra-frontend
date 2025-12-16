/**
 * Logger - Sistema de logging configurable para el cliente API
 * 
 * Configuración via variables de entorno:
 * - LOG_LEVEL: debug | info | warn | error (default: info)
 * - LOG_PAYLOADS: true | false - Log request body (default: false)
 * - LOG_RESPONSES: true | false - Log response data (default: false)
 * - LOG_HEADERS: true | false - Log headers (default: false)
 */

// ============================================================================
// Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
    traceId: string;
    endpoint: string;
    method: string;
    duration?: number;
    statusCode?: number;
    payload?: unknown;
    response?: unknown;
    headers?: Record<string, string>;
    error?: Error | unknown;
}

// ============================================================================
// Configuration
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const getConfig = () => ({
    level: (process.env.LOG_LEVEL || process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as LogLevel,
    logPayloads: process.env.LOG_PAYLOADS === 'true' || process.env.NEXT_PUBLIC_LOG_PAYLOADS === 'true',
    logResponses: process.env.LOG_RESPONSES === 'true' || process.env.NEXT_PUBLIC_LOG_RESPONSES === 'true',
    logHeaders: process.env.LOG_HEADERS === 'true' || process.env.NEXT_PUBLIC_LOG_HEADERS === 'true',
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Genera un trace ID único para correlacionar requests
 */
export const generateTraceId = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
};

/**
 * Verifica si el nivel actual permite el log
 */
const shouldLog = (level: LogLevel): boolean => {
    const config = getConfig();
    return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
};

/**
 * Formatea el contexto del log
 */
const formatContext = (ctx: LogContext): Record<string, unknown> => {
    const config = getConfig();
    const formatted: Record<string, unknown> = {
        traceId: ctx.traceId,
        endpoint: ctx.endpoint,
        method: ctx.method,
    };

    if (ctx.duration !== undefined) {
        formatted.duration = `${ctx.duration}ms`;
    }

    if (ctx.statusCode !== undefined) {
        formatted.statusCode = ctx.statusCode;
    }

    if (config.logPayloads && ctx.payload !== undefined) {
        formatted.payload = ctx.payload;
    }

    if (config.logResponses && ctx.response !== undefined) {
        formatted.response = ctx.response;
    }

    if (config.logHeaders && ctx.headers !== undefined) {
        formatted.headers = ctx.headers;
    }

    if (ctx.error !== undefined) {
        formatted.error = ctx.error instanceof Error
            ? { message: ctx.error.message, stack: ctx.error.stack }
            : ctx.error;
    }

    return formatted;
};

/**
 * Crea el mensaje formateado para consola
 */
const formatMessage = (level: LogLevel, ctx: LogContext, message: string): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${ctx.traceId}] ${message}`;
};

// ============================================================================
// Logger Implementation
// ============================================================================

const createLogFunction = (level: LogLevel) => {
    return (ctx: LogContext, message: string): void => {
        if (!shouldLog(level)) return;

        const formattedMessage = formatMessage(level, ctx, message);
        const context = formatContext(ctx);

        switch (level) {
            case 'debug':
                console.debug(formattedMessage, context);
                break;
            case 'info':
                console.info(formattedMessage, context);
                break;
            case 'warn':
                console.warn(formattedMessage, context);
                break;
            case 'error':
                console.error(formattedMessage, context);
                break;
        }
    };
};

export const logger = {
    debug: createLogFunction('debug'),
    info: createLogFunction('info'),
    warn: createLogFunction('warn'),
    error: createLogFunction('error'),

    /**
     * Crea un contexto inicial para un request
     */
    createContext: (endpoint: string, method: string, payload?: unknown): LogContext => ({
        traceId: generateTraceId(),
        endpoint,
        method,
        payload,
    }),

    /**
     * Actualiza el contexto con la respuesta
     */
    withResponse: (ctx: LogContext, response: unknown, statusCode: number, duration: number): LogContext => ({
        ...ctx,
        response,
        statusCode,
        duration,
    }),

    /**
     * Actualiza el contexto con un error
     */
    withError: (ctx: LogContext, error: Error | unknown, duration: number): LogContext => ({
        ...ctx,
        error,
        duration,
    }),
};

export default logger;
