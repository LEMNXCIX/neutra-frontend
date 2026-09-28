/**
 * API Route for the caller's own tenant memberships
 */

import { createGetHandler } from '@/lib/api-route-handler';

/**
 * GET /api/tenants/mine
 */
export const GET = createGetHandler('/tenants/mine');
