import { createPostHandler } from "@/lib/api-route-handler";

/**
 * POST /api/auth/reset-password
 * Proxy to backend API for resetting password
 */
export const POST = createPostHandler("/auth/reset-password", {
    passThroughStatus: true,
});
