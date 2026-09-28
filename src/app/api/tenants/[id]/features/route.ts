import { createGetHandler, createPutHandler } from "@/lib/api-route-handler";

/**
 * GET /api/tenants/[id]/features
 */
export const GET = createGetHandler(
    (_req, params) => `/tenants/${params?.id}/features`,
    { passThroughStatus: true },
);

/**
 * PUT /api/tenants/[id]/features
 */
export const PUT = createPutHandler(
    (_req, params) => `/tenants/${params?.id}/features`,
    { passThroughStatus: true },
);
