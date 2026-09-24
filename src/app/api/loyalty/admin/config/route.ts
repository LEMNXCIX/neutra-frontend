import {
    createGetHandler,
    createPutHandler,
} from "@/lib/api-route-handler";

export const GET = createGetHandler("/loyalty/admin/config");
export const PUT = createPutHandler("/loyalty/admin/config");
