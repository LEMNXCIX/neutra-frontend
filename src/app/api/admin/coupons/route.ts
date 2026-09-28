/**
 * API Routes for Admin Coupons - Refactored with unified handler
 */

import {
    createListWithStatsHandler,
    createPostHandler,
} from "@/lib/api-route-handler";

/**
 * GET /api/admin/coupons
 * Proxy to backend API for coupons list + statistics
 */
export const GET = createListWithStatsHandler("/coupons", "/coupons/stats");

/**
 * POST /api/admin/coupons
 * Create coupon via backend
 */
export const POST = createPostHandler("/coupons");
