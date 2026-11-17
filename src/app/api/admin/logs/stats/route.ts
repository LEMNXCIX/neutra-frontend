/**
 * API Route for Admin Logs statistics.
 */
import { createGetHandler } from "@/lib/api-route-handler";

export const GET = createGetHandler("/admin/logs/stats");
