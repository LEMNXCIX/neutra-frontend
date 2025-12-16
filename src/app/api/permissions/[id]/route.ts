/**
 * API Routes for Permissions by ID - Refactored with unified handler
 */

import {
    createGetHandler,
    createPutHandler,
    createDeleteHandler
} from '@/lib/api-route-handler';

/**
 * GET /api/permissions/[id]
 */
export const GET = createGetHandler(
    (req, params) => `/permissions/${params?.id}`
);

/**
 * PUT /api/permissions/[id]
 */
export const PUT = createPutHandler(
    (req, params) => `/permissions/${params?.id}`
);

/**
 * DELETE /api/permissions/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/permissions/${params?.id}`
);
