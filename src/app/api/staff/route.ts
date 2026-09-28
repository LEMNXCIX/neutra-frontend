import { createGetHandler, createPostHandler } from "@/lib/api-route-handler";

/**
 * GET /api/staff
 * Defaults activeOnly to true when the caller omits it.
 */
export const GET = createGetHandler(
    (req) =>
        `/staff?activeOnly=${req.nextUrl.searchParams.get("activeOnly") ?? "true"}`,
    { passThroughStatus: true, includeQueryParams: false },
);

/**
 * POST /api/staff
 */
export const POST = createPostHandler("/staff", { passThroughStatus: true });
