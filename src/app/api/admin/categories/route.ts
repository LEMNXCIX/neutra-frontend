/**
 * API Routes for Admin Categories - Refactored with unified handler
 */

import { createPostHandler, createListWithStatsHandler } from '@/lib/api-route-handler';

/**
 * GET /api/admin/categories
 * Proxy to backend API for categories list + statistics
 */
export const GET = createListWithStatsHandler('/categories', '/categories/stats');

/**
 * POST /api/admin/categories
 * Create category via backend
 */
export const POST = createPostHandler('/categories');
