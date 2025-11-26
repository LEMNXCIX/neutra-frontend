import { ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

/**
 * Custom hook for handling API errors
 * 
 * Provides consistent error handling across the application
 */
export function useApiError() {
    const handleError = (error: unknown) => {
        if (error instanceof ApiError) {
            // Show user-friendly message
            toast.error(error.message);

            // Log trace ID for debugging
            if (error.traceId) {
                console.error(`[ERROR] Trace ID: ${error.traceId}`);
            }

            // Handle validation errors
            if (error.errors && error.errors.length > 0) {
                error.errors.forEach((e: any) => {
                    if (e.field) {
                        // Show field-specific error
                        toast.error(`${e.field}: ${e.message}`);
                    } else if (e.message) {
                        toast.error(e.message);
                    }
                });
            }

            return {
                message: error.message,
                statusCode: error.statusCode,
                errors: error.errors,
                traceId: error.traceId,
            };
        }

        // Generic error
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);

        return {
            message,
            statusCode: 500,
            errors: [],
        };
    };

    return { handleError };
}
