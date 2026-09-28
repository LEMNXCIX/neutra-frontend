import { describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({
    toast: {
        error: (...args: unknown[]) => toastError(...args),
    },
}));

import { reportError } from "@/lib/error-reporting";

describe("reportError", () => {
    it("translates from the backend code instead of showing its message", () => {
        const message = reportError(
            {
                message: "Validación fallida",
                errors: [
                    {
                        code: "AUTH_INVALID_CREDENTIALS",
                        message: "invalid credentials",
                        field: "password",
                    },
                ],
            },
            "No pudimos iniciar sesión. Inténtalo de nuevo.",
        );

        expect(message).toContain("correo o la contraseña");
        expect(message).not.toContain("invalid credentials");
        expect(message).not.toBe("Validación fallida");
    });

    it("toasts the translated message by default", () => {
        toastError.mockClear();
        reportError(
            {
                errors: [
                    { code: "AUTH_TOKEN_EXPIRED", message: "token expired" },
                ],
            },
            "fallback",
        );

        expect(toastError).toHaveBeenCalledTimes(1);
        expect(toastError.mock.calls[0][0]).toContain("sesión expiró");
    });

    it("stays silent but still returns the text when the form shows it inline", () => {
        toastError.mockClear();
        const message = reportError(
            {
                errors: [
                    {
                        code: "BUSINESS_INSUFFICIENT_STOCK",
                        message: "no stock",
                    },
                ],
            },
            "fallback",
            { toast: false },
        );

        expect(toastError).not.toHaveBeenCalled();
        expect(message).toContain("stock");
    });

    it("uses the caller fallback when there is no code to translate", () => {
        toastError.mockClear();
        const message = reportError(
            new Error("EN intern"),
            "No pudimos guardar los cambios.",
        );

        expect(message).toBe("No pudimos guardar los cambios.");
        expect(toastError).toHaveBeenCalledWith(
            "No pudimos guardar los cambios.",
        );
    });

    it("handles a thrown non-Error", () => {
        expect(reportError("texto suelto", "fallback")).toBe("fallback");
        expect(reportError(undefined, "fallback")).toBe("fallback");
    });
});
