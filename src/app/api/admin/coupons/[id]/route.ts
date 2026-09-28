/**
 * API Routes for Admin Coupons by ID - Refactored with unified handler
 */

import { createDeleteHandler, createPutHandler } from "@/lib/api-route-handler";

/**
 * PUT /api/admin/coupons/[id]
 */
export const PUT = createPutHandler((req, params) => `/coupons/${params?.id}`);

/**
 * DELETE /api/admin/coupons/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/coupons/${params?.id}`,
);
