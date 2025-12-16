/**
 * API Routes for Roles - Refactored with unified handler
 * 
 * Uses createRouteHandler for consistent logging and error handling.
 */

import { createGetHandler, createPostHandler } from '@/lib/api-route-handler';

/**
 * GET /api/roles
 * Fetch all roles with optional query params (search, pagination)
 */
export const GET = createGetHandler('/roles');

/**
 * POST /api/roles
 * Create a new role
 */
export const POST = createPostHandler('/roles');
