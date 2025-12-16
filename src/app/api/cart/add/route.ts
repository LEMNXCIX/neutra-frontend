import { createPostHandler } from "@/lib/api-route-handler";

export const dynamic = 'force-dynamic';

/**
 * POST /api/cart/add
 * Add item to cart
 */
export const POST = createPostHandler('/cart/add');
