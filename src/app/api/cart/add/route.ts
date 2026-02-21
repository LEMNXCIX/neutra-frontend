/**
 * API Routes for Cart - Add Item
 */

import { createPostHandler } from '@/lib/api-route-handler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cart/add
 */
export const POST = createPostHandler('/cart/add');
