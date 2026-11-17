import {
    createCsrfMiddleware,
    createMiddleware,
    createStart,
} from "@tanstack/react-start";
import type { TenantContext } from "./lib/server-context";
import { resolveTenantIdentity } from "./lib/tenant-request";

/**
 * The server entry (`src/server.ts`) already injects the tenant identity into
 * the request. Re-applying it here keeps a single source of truth for the
 * header values and lets server functions read the result through
 * `getTenantContext()` instead of parsing headers themselves.
 */
const tenantContextMiddleware = createMiddleware().server(
    async ({ request, next }) => {
        // Header-only resolution: cloning the Request here would transfer its
        // body stream and leave BFF POST handlers with an unparseable body.
        const identity = await resolveTenantIdentity(request);

        const tenant: TenantContext = {
            slug: identity.slug,
            moduleType: identity.moduleType,
            tenantId: identity.tenantId,
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
