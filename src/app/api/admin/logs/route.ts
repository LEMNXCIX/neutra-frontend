/**
 * API Route for Admin Logs - proxies to the backend with the unified handler
 * so query params (level, page, timeframe...) reach the real API.
 */
import { createGetHandler } from "@/lib/api-route-handler";

export const GET = createGetHandler("/admin/logs");
