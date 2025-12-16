import { createGetHandler } from "@/lib/api-route-handler";

export const dynamic = 'force-dynamic';

/**
 * GET /api/cart
 * Fetch current user's cart
 */
export const GET = createGetHandler('/cart');
