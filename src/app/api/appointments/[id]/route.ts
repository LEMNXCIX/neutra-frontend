import { createDeleteHandler, createGetHandler } from "@/lib/api-route-handler";

/**
 * GET /api/appointments/[id]
 */
export const GET = createGetHandler(
    (_req, params) => `/appointments/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * DELETE /api/appointments/[id]
 */
export const DELETE = createDeleteHandler(
    (_req, params) => `/appointments/${params?.id}`,
    { passThroughStatus: true },
);
