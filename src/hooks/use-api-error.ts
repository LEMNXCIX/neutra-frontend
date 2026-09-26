import { ApiError } from "@/lib/api-client";
import { errorMessageFrom } from "@/lib/error-messages";
import { toast } from "sonner";

const handleError = (error: unknown) => {
    if (error instanceof ApiError) {
        // Translated from the backend error code, never from errors[].message,
        // which arrives in English. The envelope message is backend text too, so
        // the fallback is the copy this module already speaks.
        const message = errorMessageFrom(error, "No pudimos completar la operación.");
        toast.error(message);

        if (error.traceId) {
            console.error(`[ERROR] Trace ID: ${error.traceId}`);
        }

        return {
            message,
            statusCode: error.statusCode,
            errors: error.errors,
            traceId: error.traceId,
        };
    }

    const message = errorMessageFrom(error, "Ocurrió un error inesperado");
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
