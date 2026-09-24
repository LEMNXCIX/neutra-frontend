import { createPostHandler } from "@/lib/api-route-handler";

export const POST = createPostHandler("/loyalty/me/claim", {
    successStatus: 200,
});
