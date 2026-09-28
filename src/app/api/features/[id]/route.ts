import {
    createDeleteHandler,
    createGetHandler,
    createPutHandler,
} from "@/lib/api-route-handler";

/**
 * GET /api/features/[id]
 */
export const GET = createGetHandler(
    (_req, params) => `/features/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * PUT /api/features/[id]
 */
export const PUT = createPutHandler(
    (_req, params) => `/features/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * DELETE /api/features/[id]
 */
export const DELETE = createDeleteHandler(
    (_req, params) => `/features/${params?.id}`,
    { passThroughStatus: true },
);
