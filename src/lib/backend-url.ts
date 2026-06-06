/**
 * Backend URL Configuration
 *
 * Resolves the backend API URL for server-side (BFF) communication.
 *
 * Priority: BACKEND_API_URL > NEXT_PUBLIC_API_URL (deprecated for BFF) > fallback
 *
 * IMPORTANT: NEXT_PUBLIC_API_URL is exposed to the browser bundle.
 * It is kept here ONLY as temporary backward compatibility.
 * All server-side code MUST migrate to BACKEND_API_URL.
 * See: docs/bff-refactor-plan.md, docs/environment-variable-consolidation.md
 */

export function getBackendUrl(): string {
  const rawBackendUrl =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4001/api';

  if (!process.env.BACKEND_API_URL && process.env.NEXT_PUBLIC_API_URL) {
    console.warn(
      '[getBackendUrl] BACKEND_API_URL is not set. Falling back to NEXT_PUBLIC_API_URL, which is deprecated for server-side use. Set BACKEND_API_URL in your environment.',
    );
  }

  return rawBackendUrl.endsWith('/api') ? rawBackendUrl : `${rawBackendUrl}/api`;
}
