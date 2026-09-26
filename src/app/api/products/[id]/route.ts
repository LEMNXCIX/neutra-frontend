import { createDeleteHandler, createGetHandler, createPutHandler } from '@/lib/api-route-handler';

/**
 * GET /api/products/[id]
 * Proxy to backend API for single product
 */
export const GET = createGetHandler(
    (_req, params) => `/products/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * PUT /api/products/[id]
 * Proxy to backend API for product update
 */
export const PUT = createPutHandler(
    (_req, params) => `/products/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * DELETE /api/products/[id]
 * Proxy to backend API for product deletion
 */
export const DELETE = createDeleteHandler(
    (_req, params) => `/products/${params?.id}`,
    { passThroughStatus: true },
);
