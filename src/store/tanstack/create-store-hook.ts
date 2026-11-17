import { useSelector } from "@tanstack/react-store";
import type { Store, StoreActionMap } from "@tanstack/store";
import { useMemo } from "react";

type PartialOrUpdater<S> = Partial<S> | ((prev: S) => Partial<S>);

export type StoreHook<S extends object, A extends StoreActionMap> = {
    (): S & A;
    <T>(selector: (state: S & A) => T): T;
    getState(): S & A;
    setState(partial: PartialOrUpdater<S>): void;
};

/**
 * Bridges a TanStack Store to the zustand-shaped hook API the app already
 * consumes. Actions live in `store.actions` (TanStack's stable actions
 * factory); this wrapper merges them into the value returned by `getState()`
 * and by the no-argument hook form, so existing call sites such as
 * `useAuthStore((s) => s.login)` and `useCartStore().items` keep working.
 */
export function createStoreHook<S extends object, A extends StoreActionMap>(
    store: Store<S, A>,
): StoreHook<S, A> {
    const { actions } = store;
    const getState = () => ({ ...store.get(), ...actions }) as S & A;

    const setState = (partial: PartialOrUpdater<S>): void => {
        store.setState((prev) => ({
            ...prev,
            ...(typeof partial === "function" ? partial(prev) : partial),
        }));
    };

    const useStoreHook = <T>(selector?: (state: S & A) => T): T | (S & A) => {
        const state = useSelector(store);
        const merged = useMemo(
            () => ({ ...state, ...actions }) as S & A,
            [state],
        );
        return selector ? selector(merged) : merged;
    };

    const storeHook = useStoreHook as StoreHook<S, A>;
    storeHook.getState = getState;
    storeHook.setState = setState;
    return storeHook;
}
