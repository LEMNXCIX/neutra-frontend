import { createPutHandler } from "@/lib/api-route-handler";

/**
 * PUT /api/appointments/[id]/cancel
 * Backend route: PUT /api/appointments/:id/cancel
 */
export const PUT = createPutHandler(
    (_req, params) => `/appointments/${params?.id}/cancel`,
    { passThroughStatus: true },
);
