/**
 * API Routes for Users - Refactored with unified handler
 */

import { createGetHandler } from '@/lib/api-route-handler';

/**
 * GET /api/users
 */
export const GET = createGetHandler('/users');
