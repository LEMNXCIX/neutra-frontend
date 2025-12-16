/**
 * API Routes for Roles by ID - Refactored with unified handler
 */

import {
    createGetHandler,
    createPutHandler,
    createDeleteHandler
} from '@/lib/api-route-handler';

/**
 * GET /api/roles/[id]
 */
export const GET = createGetHandler(
    (req, params) => `/roles/${params?.id}`
);

/**
 * PUT /api/roles/[id]
 */
export const PUT = createPutHandler(
    (req, params) => `/roles/${params?.id}`
);

/**
 * DELETE /api/roles/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/roles/${params?.id}`
);
