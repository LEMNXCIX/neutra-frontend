/**
 * API Routes for Platform Features - Refactored with unified handler
 */

import { createGetHandler, createPostHandler } from '@/lib/api-route-handler';

/**
 * GET /api/features
 */
export const GET = createGetHandler('/features');

/**
 * POST /api/features
 */
export const POST = createPostHandler('/features');
