/**
 * API Routes for Products - Refactored with unified handler
 */

import { createGetHandler, createPostHandler } from '@/lib/api-route-handler';

/**
 * GET /api/products
 * Fetch products for the current tenant
 */
export const GET = createGetHandler('/products');

/**
 * POST /api/products
 * Create product via backend (proxied)
 */
export const POST = createPostHandler('/products');
