/**
 * API Routes for Admin Banners by ID - Refactored with unified handler
 */

import {
    createPutHandler,
    createDeleteHandler
} from '@/lib/api-route-handler';

/**
 * PUT /api/admin/banners/[id]
 */
export const PUT = createPutHandler(
    (req, params) => `/banners/${params?.id}`
);

/**
 * DELETE /api/admin/banners/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/banners/${params?.id}`
);
