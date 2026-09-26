import { toast } from "sonner";

import { errorMessageFrom } from "./error-messages";

/**
 * Single place where a caught error becomes something the user reads.
 *
 * Before this, every caller reached for the thrown object directly:
 * `toast.error(err instanceof ApiError ? err.message : "...")`. The envelope
 * `message` is forwarded verbatim by the BFF from the backend, so that pattern
 * rendered backend text, in English, whenever the backend had one. The code in
 * `errors[]` is the stable half of the contract and is what gets translated
 * here, with `fallback` as the Spanish last resort.
 *
 * A toast is the default because an action can fail from a table row, a dialog
 * or a wizard step, and each of those needs to say so somewhere. Forms that
 * render the reason next to their fields pass `toast: false` and get the same
 * string back to display inline.
 */
export function reportError(
    error: unknown,
    fallback: string,
    options: { toast?: boolean } = {},
): string {
    const message = errorMessageFrom(error, fallback);

    if (options.toast !== false) {
        toast.error(message);
    }

    return message;
}
