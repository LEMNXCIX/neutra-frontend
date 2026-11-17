"use client";

import { useSyncExternalStore } from "react";
import {
    EMPTY_TENANT,
    syncTenantFromCookies,
    type TenantSnapshot,
    tenantStore,
} from "./tanstack/tenant-store";

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
 *
 * The state itself lives in a TanStack Store; this hook keeps its own raw
 * `useSyncExternalStore` binding because TanStack's `useSelector` feeds the live
 * state as the server snapshot too, which would reintroduce that mismatch.
 */
const subscribe = (listener: () => void) => {
    const { unsubscribe } = tenantStore.subscribe(listener);
    return unsubscribe;
};

const getSnapshot = () => tenantStore.get();
const getServerSnapshot = (): TenantSnapshot => EMPTY_TENANT;

const applySnapshot = (next: TenantSnapshot) => {
    tenantStore.setState(() => next);
};

/**
 * Hydration-safe tenant store. Usable exactly like the Zustand hook it
 * replaces: `useTenantStore()` for the whole state, `useTenantStore(s => s.id)`
 * for a field, `getState()` and `setState()` outside React.
 *
 * The no-argument form must include the actions, not just the data: callers
 * destructure `{ tenantId, syncFromCookies }` from it. Returning a bare
 * snapshot here made every one of those call sites receive undefined and threw
 * "syncFromCookies is not a function" on mount. The action is a module-level
 * constant so it keeps a stable identity across renders and stays a valid
 * useEffect dependency.
 */
interface TenantStoreHook {
    (): TenantState;
    <T>(selector: (state: TenantSnapshot) => T): T;
    getState(): TenantSnapshot;
    setState(partial: Partial<TenantSnapshot>): void;
    syncFromCookies(): void;
}

const syncFromCookies = () => syncTenantFromCookies();

const useTenantStoreImpl = <T>(
    selector?: (state: TenantSnapshot) => T,
): TenantState | T => {
    const snapshot = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );
    if (selector) return selector(snapshot);
    return { ...snapshot, syncFromCookies };
};

export const useTenantStore = useTenantStoreImpl as TenantStoreHook;
useTenantStore.getState = getSnapshot;
useTenantStore.setState = (partial: Partial<TenantSnapshot>) => {
    applySnapshot({ ...getSnapshot(), ...partial });
};
useTenantStore.syncFromCookies = syncFromCookies;

export type { TenantSnapshot, TenantState };

/** Test seam: reset module state between cases. */
export const tenantStoreApi = {
    get: getSnapshot,
    set: (partial: Partial<TenantSnapshot>) => {
        applySnapshot({ ...getSnapshot(), ...partial });
    },
    syncFromCookies,
    reset: () => applySnapshot({ ...EMPTY_TENANT }),
};
