/**
 * API Routes for Tenants - Refactored with unified handler
 */

import { createGetHandler, createPostHandler } from '@/lib/api-route-handler';

/**
 * GET /api/tenants
 */
export const GET = createGetHandler('/tenants');

/**
 * POST /api/tenants
 */
export const POST = createPostHandler('/tenants');
