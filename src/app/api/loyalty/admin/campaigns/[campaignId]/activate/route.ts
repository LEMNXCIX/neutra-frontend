import {
    createPostHandler,
    type EndpointResolver,
} from "@/lib/api-route-handler";

const endpoint: EndpointResolver = (_request, params) => {
    const campaignId = encodeURIComponent(params?.campaignId ?? "");
    return `/loyalty/admin/campaigns/${campaignId}/activate`;
};

export const POST = createPostHandler(endpoint, { successStatus: 200 });
