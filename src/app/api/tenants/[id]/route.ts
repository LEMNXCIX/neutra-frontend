import { createGetHandler, createPutHandler } from '@/lib/api-route-handler';

/**
 * GET /api/tenants/[id]
 */
export const GET = createGetHandler(
    (_req, params) => `/tenants/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * PUT /api/tenants/[id]
 */
export const PUT = createPutHandler(
    (_req, params) => `/tenants/${params?.id}`,
    { passThroughStatus: true },
);
