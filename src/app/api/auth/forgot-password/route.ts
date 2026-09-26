import { createPostHandler } from '@/lib/api-route-handler';

/**
 * POST /api/auth/forgot-password
 * Proxy to backend API for password reset request
 */
export const POST = createPostHandler('/auth/forgot-password', {
    passThroughStatus: true,
});
