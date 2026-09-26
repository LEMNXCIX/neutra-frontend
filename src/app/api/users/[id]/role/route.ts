import { createPutHandler } from '@/lib/api-route-handler';

/**
 * PUT /api/users/[id]/role
 * Proxy to backend API to assign a role to a user
 */
export const PUT = createPutHandler(
    (_req, params) => `/users/${params?.id}/role`,
    { passThroughStatus: true },
);
