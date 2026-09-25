import {
    createGetHandler,
    type EndpointResolver,
} from "@/lib/api-route-handler";

const endpoint: EndpointResolver = (_request, params) => {
    const campaignId = encodeURIComponent(params?.campaignId ?? "");
    return `/loyalty/me/campaigns/${campaignId}`;
};

export const GET = createGetHandler(endpoint);
