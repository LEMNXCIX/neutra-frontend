import { createDeleteHandler } from "@/lib/api-route-handler";

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/cart/clear
 * Clear entire cart
 */
export const DELETE = createDeleteHandler('/cart/clear');
