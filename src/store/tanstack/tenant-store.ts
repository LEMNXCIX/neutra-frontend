import { createStore, type Store } from "@tanstack/store";
import Cookies from "js-cookie";

export type TenantSnapshot = {
    tenantId: string | null;
    tenantSlug: string | null;
    moduleType: string | null;
};

export type TenantStore = Store<TenantSnapshot>;

/**
 * The proxy writes these cookies in the response, so they never exist on the
 * server. The server snapshot is therefore always empty, which is what makes the
 * first render agree between server and client. React calls getSnapshot right
 * after hydration, so the real values land on the very next render.
 */
export const EMPTY_TENANT: TenantSnapshot = {
    tenantId: null,
    tenantSlug: null,
    moduleType: null,
};

export function readTenantCookies(): TenantSnapshot {
    return {
        tenantId: Cookies.get("tenant-id") ?? null,
        tenantSlug: Cookies.get("tenant-slug") ?? null,
        moduleType: Cookies.get("module-type") ?? null,
    };
}

export function createTenantStore(): TenantStore {
    // Populate on creation in the browser so the first client render after
    // hydration already has the tenant. No-ops on the server, where the proxy
    // cookies are absent.
    const initial =
        typeof window !== "undefined"
            ? readTenantCookies()
            : { ...EMPTY_TENANT };
    return createStore<TenantSnapshot>(initial);
}

export const tenantStore = createTenantStore();

export function syncTenantFromCookies(): void {
    tenantStore.setState(() => readTenantCookies());
}
