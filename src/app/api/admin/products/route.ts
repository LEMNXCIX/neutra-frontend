/**
 * API Routes for Admin Products - Refactored with unified handler
 */

import { createPostHandler, createListWithStatsHandler } from '@/lib/api-route-handler';

/**
 * GET /api/admin/products
 * Proxy to backend API for products list + statistics
 */
export const GET = createListWithStatsHandler('/products', '/products/stats/summary');

/**
 * POST /api/admin/products
 * Create product via backend
 */
export const POST = createPostHandler('/products');
