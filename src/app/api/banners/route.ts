/**
 * API Routes for Banners - Refactored with unified handler
 */

import { createGetHandler, createPostHandler } from '@/lib/api-route-handler';

/**
 * GET /api/banners
 * Fetch active banners for the current tenant
 */
export const GET = createGetHandler('/banners');

/**
 * POST /api/banners
 * Create banner via backend (proxied)
 */
export const POST = createPostHandler('/banners');
