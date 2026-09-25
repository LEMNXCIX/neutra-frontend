import {
    createDeleteHandler,
    createGetHandler,
    createPatchHandler,
    type EndpointResolver,
} from "@/lib/api-route-handler";

const endpoint: EndpointResolver = (_request, params) => {
    const campaignId = encodeURIComponent(params?.campaignId ?? "");
    return `/loyalty/admin/campaigns/${campaignId}`;
};

export const GET = createGetHandler(endpoint);
export const PATCH = createPatchHandler(endpoint);
export const DELETE = createDeleteHandler(endpoint);
