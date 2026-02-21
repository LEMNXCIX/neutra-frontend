/**
 * API Routes for Admin Categories by ID - Refactored with unified handler
 */

import {
    createPutHandler,
    createDeleteHandler
} from '@/lib/api-route-handler';

/**
 * PUT /api/admin/categories/[id]
 */
export const PUT = createPutHandler(
    (req, params) => `/categories/${params?.id}`
);

/**
 * DELETE /api/admin/categories/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/categories/${params?.id}`
);
