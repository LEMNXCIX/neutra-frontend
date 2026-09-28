import { createGetHandler } from "@/lib/api-route-handler";

/**
 * GET /api/staff/me
 */
export const GET = createGetHandler("/staff/me", { passThroughStatus: true });
