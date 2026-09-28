/**
 * API Routes for Admin Orders - Refactored with unified handler
 */

import {
    createListWithStatsHandler,
    createPostHandler,
} from "@/lib/api-route-handler";

/**
 * GET /api/admin/orders
 * Proxy to backend API for orders list + statistics
 */
export const GET = createListWithStatsHandler("/order", "/order/stats");

/**
 * POST /api/admin/orders
 * Create order via backend
 */
export const POST = createPostHandler("/order");
