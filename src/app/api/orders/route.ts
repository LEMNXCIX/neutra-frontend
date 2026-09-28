import { createGetHandler, createPostHandler } from "@/lib/api-route-handler";

/**
 * GET /api/orders
 * Proxy to backend API for orders
 */
export const GET = createGetHandler("/order", { passThroughStatus: true });

/**
 * POST /api/orders
 * Proxy to backend API to create order
 */
export const POST = createPostHandler("/order", { passThroughStatus: true });
