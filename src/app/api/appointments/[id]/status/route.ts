import { createPutHandler } from "@/lib/api-route-handler";

/**
 * PUT /api/appointments/[id]/status
 * Backend route: PUT /api/appointments/:id/status
 */
export const PUT = createPutHandler(
    (_req, params) => `/appointments/${params?.id}/status`,
    { passThroughStatus: true },
);
