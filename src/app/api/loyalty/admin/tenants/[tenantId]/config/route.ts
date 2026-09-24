import {
    createGetHandler,
    createPutHandler,
    type EndpointResolver,
} from "@/lib/api-route-handler";

const endpoint: EndpointResolver = (_request, params) => {
    const tenantId = encodeURIComponent(params?.tenantId ?? "");
    return `/loyalty/admin/tenants/${tenantId}/config`;
}

export const GET = createGetHandler(endpoint);
export const PUT = createPutHandler(endpoint);
