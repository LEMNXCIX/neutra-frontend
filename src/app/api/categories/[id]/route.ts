import {
    createDeleteHandler,
    createGetHandler,
    createPutHandler,
} from "@/lib/api-route-handler";

/**
 * GET /api/categories/[id]
 */
export const GET = createGetHandler(
    (_req, params) => `/categories/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * PUT /api/categories/[id]
 */
export const PUT = createPutHandler(
    (_req, params) => `/categories/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * DELETE /api/categories/[id]
 */
export const DELETE = createDeleteHandler(
    (_req, params) => `/categories/${params?.id}`,
    { passThroughStatus: true },
);
