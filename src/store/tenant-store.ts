"use client";

import { useSyncExternalStore } from "react";
import Cookies from "js-cookie";

type TenantSnapshot = {
    tenantId: string | null;
    tenantSlug: string | null;
    moduleType: string | null;
};

type TenantState = TenantSnapshot & {
    /** Re-read tenant cookies set by the proxy (e.g. after first navigation). */
    syncFromCookies: () => void;
};

/**
 * The proxy writes these cookies in the response, so they never exist on the
 * server. The server snapshot is therefore always empty, which is what makes the
 * first render agree between server and client. React calls getSnapshot right
 * after hydration, so the real values land on the very next render.
 *
 * Before this, the store read the cookies in its initializer: the server got
 * null while the client got a real id, so every component branching on
 * tenantId during render produced a hydration mismatch. AppearanceClient was the
 * visible one, the same latent bug sat behind the other seven consumers.
 */
const EMPTY: TenantSnapshot = {
    tenantId: null,
    tenantSlug: null,
    moduleType: null,
};

let current: TenantSnapshot = { ...EMPTY };
const listeners = new Set<() => void>();

const emit = () => {
    for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const getSnapshot = () => current;
const getServerSnapshot = (): TenantSnapshot => EMPTY;

const readCookies = (): TenantSnapshot => ({
    tenantId: Cookies.get("tenant-id") ?? null,
    tenantSlug: Cookies.get("tenant-slug") ?? null,
    moduleType: Cookies.get("module-type") ?? null,
});

const applySnapshot = (next: TenantSnapshot) => {
    current = next;
    emit();
};

/**
 * Hydration-safe tenant store. Usable exactly like the Zustand hook it
 * replaces: `useTenantStore()` for the whole state, `useTenantStore(s => s.id)`
 * for a field, `getState()` and `setState()` outside React.
 */
interface TenantStoreHook {
    (): TenantState;
    <T>(selector: (state: TenantSnapshot) => T): T;
    getState(): TenantSnapshot;
    setState(partial: Partial<TenantSnapshot>): void;
    syncFromCookies(): void;
}

const useTenantStoreImpl = <T,>(
    selector?: (state: TenantSnapshot) => T,
): TenantState | T => {
    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return selector ? selector(state) : (state as unknown as TenantState);
};

export const useTenantStore = useTenantStoreImpl as TenantStoreHook;
useTenantStore.getState = getSnapshot;
useTenantStore.setState = (partial: Partial<TenantSnapshot>) => {
    applySnapshot({ ...current, ...partial });
};
useTenantStore.syncFromCookies = () => applySnapshot(readCookies());

export type { TenantSnapshot, TenantState };

/** Test seam: reset module state between cases. */
export const tenantStoreApi = {
    get: getSnapshot,
    syncFromCookies: () => applySnapshot(readCookies()),
    reset: () => applySnapshot({ ...EMPTY }),
};

// Populate on module load in the browser so the first client render after
// hydration already has the tenant. No-ops on the server where Cookies is empty.
if (typeof window !== "undefined") {
    current = readCookies();
}
