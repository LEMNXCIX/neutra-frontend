import { errorMessageFrom, translatedFieldErrors } from "./error-messages";

/**
 * Writes one field's server-side error into a TanStack Form field meta. Passing
 * `undefined` clears it, which is what a new submit attempt needs before the
 * next backend response arrives.
 */
export type FieldErrorSetter = (
    field: string,
    message: string | undefined,
) => void;

type ApplyServerErrorsOptions = {
    error: unknown;
    /** Spanish copy used when the thrown error carries no translated code. */
    fallback: string;
    /** Field names the form can render an inline error for. */
    knownFields: readonly string[];
    setFormError: (message: string) => void;
    setFieldError: FieldErrorSetter;
};

/**
 * Turn a rejected backend call into form state.
 *
 * The first usable `errors[].code` (or the caller's Spanish fallback) becomes
 * the form-level message shown in the banner, while every detail carrying a
 * `field` this form owns becomes a field-level `onServer` error. Nothing here
 * reads the backend's English `message` — translation lives in
 * `error-messages.ts`, so this helper only routes already-translated strings.
 */
export function applyServerErrors({
    error,
    fallback,
    knownFields,
    setFormError,
    setFieldError,
}: ApplyServerErrorsOptions): void {
    for (const detail of translatedFieldErrors(error)) {
        if (detail.field && knownFields.includes(detail.field)) {
            setFieldError(detail.field, detail.message);
        }
    }
    setFormError(errorMessageFrom(error, fallback));
}

/** Drop stale server errors before re-submitting a form. */
export function clearFieldErrors(
    knownFields: readonly string[],
    setFieldError: FieldErrorSetter,
): void {
    for (const field of knownFields) setFieldError(field, undefined);
}

/**
 * Inline error text for a TanStack Form field, excluding a message already
 * shown in the form-level banner (avoids printing the same copy twice).
 */
export function inlineFieldErrors(
    errors: readonly unknown[],
    formError: string,
): string[] {
    return errors.filter(
        (error): error is string =>
            typeof error === "string" &&
            error.length > 0 &&
            error !== formError,
    );
}
