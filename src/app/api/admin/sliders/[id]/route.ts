/**
 * API Routes for Admin Sliders by ID - Refactored with unified handler
 */

import {
    createPutHandler,
    createDeleteHandler
} from '@/lib/api-route-handler';

/**
 * PUT /api/admin/sliders/[id]
 */
export const PUT = createPutHandler(
    (req, params) => `/slide/${params?.id}`
);

/**
 * DELETE /api/admin/sliders/[id]
 */
export const DELETE = createDeleteHandler(
    (req, params) => `/slide/${params?.id}`
);
