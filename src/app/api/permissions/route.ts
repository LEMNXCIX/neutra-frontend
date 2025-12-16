/**
 * API Routes for Permissions - Refactored with unified handler
 */

import { createGetHandler, createPostHandler } from '@/lib/api-route-handler';

/**
 * GET /api/permissions
 * Fetch all permissions with optional query params (search, pagination)
 */
export const GET = createGetHandler('/permissions');

/**
 * POST /api/permissions
 * Create a new permission
 */
export const POST = createPostHandler('/permissions');
