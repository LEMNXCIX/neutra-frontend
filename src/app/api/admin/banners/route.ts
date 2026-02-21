/**
 * API Routes for Admin Banners - Refactored with unified handler
 */

import { createPostHandler, createListWithStatsHandler } from '@/lib/api-route-handler';

/**
 * GET /api/admin/banners
 * Proxy to backend API for banners list + statistics
 */
export const GET = createListWithStatsHandler('/banners/all/list', '/banners/stats');

/**
 * POST /api/admin/banners
 * Create banner via backend
 */
export const POST = createPostHandler('/banners');
