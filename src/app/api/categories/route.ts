/**
 * API Routes for Categories - Refactored with unified handler
 */

import { createGetHandler, createPostHandler } from '@/lib/api-route-handler';

/**
 * GET /api/categories
 * Fetch categories for the current tenant
 */
export const GET = createGetHandler('/categories');

/**
 * POST /api/categories
 * Create category via backend (proxied)
 */
export const POST = createPostHandler('/categories');
