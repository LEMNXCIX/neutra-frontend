import {
    createCsrfMiddleware,
    createMiddleware,
    createStart,
} from "@tanstack/react-start";
import type { TenantContext } from "./lib/server-context";
import { applyTenantToRequest } from "./lib/tenant-request";

/**
 * The server entry (`src/server.ts`) already injects the tenant identity into
 * the request. Re-applying it here keeps a single source of truth for the
 * header values and lets server functions read the result through
 * `getTenantContext()` instead of parsing headers themselves.
 */
const tenantContextMiddleware = createMiddleware().server(
    async ({ request, next }) => {
        const { request: tenantRequest } = await applyTenantToRequest(request);
        const headers = tenantRequest.headers;
        const moduleType = headers.get("x-module-type");

        const tenant: TenantContext = {
            slug: headers.get("x-tenant-slug") ?? "",
            moduleType:
                moduleType === "store" || moduleType === "booking"
                    ? moduleType
                    : "root",
            tenantId: headers.get("x-tenant-id") ?? "",
        };

        return next({ context: { tenant } });
    },
);

export const startInstance = createStart(() => ({
    requestMiddleware: [
        createCsrfMiddleware({
            filter: (ctx) => ctx.handlerType === "serverFn",
        }),
        tenantContextMiddleware,
    ],
}));
