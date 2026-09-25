import {
    createGetHandler,
    createPostHandler,
} from "@/lib/api-route-handler";

export const GET = createGetHandler("/loyalty/admin/campaigns");
export const POST = createPostHandler("/loyalty/admin/campaigns");
