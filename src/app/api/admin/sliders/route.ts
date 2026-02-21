/**
 * API Routes for Admin Sliders - Refactored with unified handler
 */

import { createPostHandler, createListWithStatsHandler } from '@/lib/api-route-handler';

/**
 * GET /api/admin/sliders
 * Proxy to backend API for sliders list + statistics
 */
export const GET = createListWithStatsHandler('/slide', '/slide/stats');

/**
 * POST /api/admin/sliders
 * Create slider via backend
 */
export const POST = createPostHandler('/slide');
