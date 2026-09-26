import { createDeleteHandler, createPutHandler } from '@/lib/api-route-handler';

/**
 * PUT /api/staff/[id]
 */
export const PUT = createPutHandler(
    (_req, params) => `/staff/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * DELETE /api/staff/[id]
 * Success is body-less whether the backend answers 200 or 204.
 */
export const DELETE = createDeleteHandler(
    (_req, params) => `/staff/${params?.id}`,
    { successStatus: 204 },
);
