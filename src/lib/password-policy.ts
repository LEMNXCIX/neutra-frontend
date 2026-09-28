/**
 * Minimum password length for creating or resetting a credential.
 *
 * The backend is the authority and validates this server-side on
 * `CreateUserDto` and `ResetPasswordDto` with `@MinLength(8)`, in
 * api-neutra-v2/types/request-dto.ts and
 * core/application/dtos/requests/auth.request.ts. The two repos cannot share
 * code, so the number is repeated and this comment is what keeps it findable.
 * If the backend policy changes, change it here too.
 *
 * Login deliberately has no minimum: an account created before the policy
 * exists, and the backend accepts any length there, so a shorter credential
 * still signs in and this value must not gate the login form.
 */
export const PASSWORD_MIN_LENGTH = 8;
