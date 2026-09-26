import { createPutHandler } from '@/lib/api-route-handler';

/**
 * PUT /api/staff/[id]/services
 */
export const PUT = createPutHandler(
    (_req, params) => `/staff/${params?.id}/services`,
    { passThroughStatus: true },
);
