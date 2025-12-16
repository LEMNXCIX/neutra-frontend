import { createGetHandler } from "@/lib/api-route-handler";

export const dynamic = 'force-dynamic';

/**
 * GET /api/cart/stats
 * Get cart statistics
 */
export const GET = createGetHandler('/cart/stats');
