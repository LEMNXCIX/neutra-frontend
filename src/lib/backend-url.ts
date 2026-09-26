/**
 * Backend URL Configuration
 *
 * Single source of truth for the server-side backend URL.
 *
 * Server code reads BACKEND_API_URL only. There is deliberately no fallback to
 * NEXT_PUBLIC_API_URL (a browser-facing, publicly-inlined value that can hold a
 * LAN address) and no hardcoded localhost default: a missing value must fail at
 * the call site with a clear message instead of silently pointing somewhere else.
 *
 * NEXT_PUBLIC_API_URL is no longer used anywhere. The browser reaches the backend
 * only through the BFF, and the one server-side consumer that needed it, the
 * direct OAuth redirect in auth.service.googleLogin, was dead code.
 */

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/** Add a protocol when the configured value omits it, e.g. `api:4001`. */
const ensureProtocol = (url: string): string =>
  url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`;

/**
 * Resolve the backend base URL, always ending in `/api`.
 *
 * @throws when BACKEND_API_URL is unset. Called per request, never at module load,
 * so a misconfigured environment surfaces at the call site and stays overridable
 * in tests.
 */
export function getBackendUrl(): string {
  const configured = process.env.BACKEND_API_URL?.trim();

  if (!configured) {
    throw new Error(
      'BACKEND_API_URL is not set. Server-side code must not fall back to ' +
        'NEXT_PUBLIC_API_URL or a hardcoded address. Set BACKEND_API_URL, e.g. ' +
        'BACKEND_API_URL=http://localhost:4001/api',
    );
  }

  const base = stripTrailingSlash(ensureProtocol(configured));

  return base.endsWith('/api') ? base : `${base}/api`;
}
