import { getGlobalStartContext } from "@tanstack/react-start";
import type { ModuleType } from "./tenant-request";

/** The tenant identity published to server functions by global middleware. */
export interface TenantContext {
    slug: string;
    moduleType: ModuleType;
    tenantId: string;
}

interface GlobalContextWithTenant {
    tenant: TenantContext;
}

/**
 * Typed accessor for the tenant of the current server-function request. The
 * value is placed in Start's global request context by `tenantContextMiddleware`
 * in `src/start.ts`, so no header parsing or backend lookup happens here.
 */
export function getTenantContext(): TenantContext {
    const context = getGlobalStartContext() as
        | GlobalContextWithTenant
        | undefined;
    const tenant = context?.tenant;
    if (!tenant) {
        throw new Error(
            "Tenant context is unavailable: no tenant middleware ran for this request",
        );
    }
    return tenant;
}
