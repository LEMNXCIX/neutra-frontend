import { createDeleteHandler, createGetHandler, createPutHandler } from '@/lib/api-route-handler';

/**
 * PUT /api/users/[id]
 * Proxy to backend API to update a user by ID
 */
export const PUT = createPutHandler(
    (_req, params) => `/users/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * GET /api/users/[id]
 */
export const GET = createGetHandler(
    (_req, params) => `/users/find/${params?.id}`,
    { passThroughStatus: true },
);

/**
 * DELETE /api/users/[id]
 */
export const DELETE = createDeleteHandler(
    (_req, params) => `/users/${params?.id}`,
    { passThroughStatus: true },
);
