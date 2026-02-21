/**
 * API Routes for Admin Coupons by ID - Refactored with unified handler
 */

import {
    createPutHandler,
    createDeleteHandler
} from '@/lib/api-route-handler';

/**
 * PUT /api/admin/coupons/[id]
 */
export const PUT = createPutHandler(
    (req, params) => `/coupons/${params?.id}`
);

/**
 * DELETE /api/admin/coupons/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/coupons/${params?.id}`
);
