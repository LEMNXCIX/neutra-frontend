import { createGetHandler } from '@/lib/api-route-handler';

/**
 * GET /api/users/stats
 */
export const GET = createGetHandler('/users/stats', { passThroughStatus: true });
