import { createGetHandler, createPostHandler } from "@/lib/api-route-handler";

/**
 * GET /api/services
 * Defaults activeOnly to true when the caller omits it, so the backend keeps
 * receiving the flag it used to get from the hand-rolled query string.
 */
export const GET = createGetHandler(
    (req) =>
        `/services?activeOnly=${req.nextUrl.searchParams.get("activeOnly") ?? "true"}`,
    { passThroughStatus: true, includeQueryParams: false },
);

/**
 * POST /api/services
 */
export const POST = createPostHandler("/services", { passThroughStatus: true });
