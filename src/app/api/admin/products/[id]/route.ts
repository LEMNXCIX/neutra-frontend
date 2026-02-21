/**
 * API Routes for Admin Products by ID - Refactored with unified handler
 */

import {
    createPutHandler,
    createDeleteHandler
} from '@/lib/api-route-handler';

/**
 * PUT /api/admin/products/[id]
 */
export const PUT = createPutHandler(
    (req, params) => `/products/${params?.id}`
);

/**
 * DELETE /api/admin/products/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/products/${params?.id}`
);
