import { createDeleteHandler, createPutHandler } from "@/lib/api-route-handler";

/**
 * PUT /api/services/[id]
 */
export const PUT = createPutHandler(
    (_req, params) => `/services/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * DELETE /api/services/[id]
 * Success is body-less whether the backend answers 200 or 204.
 */
export const DELETE = createDeleteHandler(
    (_req, params) => `/services/${params?.id}`,
    { successStatus: 204 },
);
