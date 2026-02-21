/**
 * API Routes for Cart - Remove Item
 */

import { createPutHandler } from '@/lib/api-route-handler';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/cart/remove
 */
export const PUT = createPutHandler('/cart/remove');
