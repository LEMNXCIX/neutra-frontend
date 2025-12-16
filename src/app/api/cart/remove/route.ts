import { createPutHandler } from "@/lib/api-route-handler";

export const dynamic = 'force-dynamic';

/**
 * PUT /api/cart/remove
 * Remove item from cart (Backend uses PUT with body)
 */
export const PUT = createPutHandler('/cart/remove');
