import { createGetHandler } from '@/lib/api-route-handler';

/**
 * GET /api/tenants/config/[slug]
 * Public endpoint: resolves tenant config (incl. branding) by slug.
 */
export const GET = createGetHandler(
    (_req, params) => `/tenants/config/${encodeURIComponent(params?.slug ?? '')}`,
    { passThroughStatus: true },
);
