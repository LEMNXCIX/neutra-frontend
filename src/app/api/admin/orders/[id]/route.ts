/**
 * API Routes for Admin Orders by ID - Refactored with unified handler
 */

import {
    createGetHandler,
    createPutHandler,
    createDeleteHandler
} from '@/lib/api-route-handler';

/**
 * GET /api/admin/orders/[id]
 */
export const GET = createGetHandler(
    (req, params) => `/order/${params?.id}`
);

/**
 * PUT /api/admin/orders/[id]
 */
export const PUT = createPutHandler(
    (req, params) => `/order/${params?.id}`
);

/**
 * DELETE /api/admin/orders/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/order/${params?.id}`
);
