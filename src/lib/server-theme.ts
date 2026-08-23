import { headers } from "next/headers";
import { tenantService } from "@/services/tenant.service";
import type { TenantBranding } from "@/types/tenant";

/**
 * Resolve the current tenant branding from the x-tenant-slug header
 * injected by the proxy middleware. Returns null when there is no tenant
 * context (e.g. superadmin) or the fetch fails. Never throws: theming is
 * decorative and must not block rendering.
 */
export async function getTenantBrandingFromHeaders(): Promise<TenantBranding | null> {
    try {
        const tenantSlug = (await headers()).get("x-tenant-slug");
        if (!tenantSlug) return null;

        const tenant = await tenantService.getBySlug(tenantSlug);
        return tenant?.config?.branding ?? null;
    } catch {
        return null;
    }
}

/**
 * Resolve the current tenant display name from the x-tenant-slug header.
 * Returns null when there is no tenant context (e.g. superadmin).
 */
export async function getTenantNameFromHeaders(): Promise<string | null> {
    try {
        const tenantSlug = (await headers()).get("x-tenant-slug");
        if (!tenantSlug) return null;

        const tenant = await tenantService.getBySlug(tenantSlug);
        return tenant?.name ?? null;
    } catch {
        return null;
    }
}
