/**
 * API Routes for Cart - Clear
 */

import { createDeleteHandler } from '@/lib/api-route-handler';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/cart/clear
 */
export const DELETE = createDeleteHandler('/cart/clear');
