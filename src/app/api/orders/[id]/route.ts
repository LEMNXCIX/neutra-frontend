import { createGetHandler } from '@/lib/api-route-handler';

/**
 * GET /api/orders/[id]
 * Proxy to backend API for single order
 */
export const GET = createGetHandler(
    (_req, params) => `/order/${params?.id}`,
    { passThroughStatus: true },
);
