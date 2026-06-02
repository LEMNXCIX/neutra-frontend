import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const handleError = (error: unknown) => {
    if (error instanceof ApiError) {
        toast.error(error.message);

        if (error.traceId) {
            console.error(`[ERROR] Trace ID: ${error.traceId}`);
        }

        if (error.errors && error.errors.length > 0) {
            (
                error.errors as Array<{ field?: string; message?: string }>
            ).forEach((e) => {
                if (e.field) {
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

    const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
    toast.error(message);

    return {
        message,
        statusCode: 500,
        errors: [],
    };
};

export function useApiError() {
    return { handleError };
}
