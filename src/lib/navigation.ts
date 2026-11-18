import {
    useLocation,
    useNavigate,
    useRouter as useTanStackRouter,
} from "@tanstack/react-router";
import { useMemo } from "react";

/**
 * TanStack-backed adapters for the three Next navigation primitives used by
 * the ported client components. They keep the original call signature so no
 * component needs a behaviour or layout rewrite; the actual routing is done by
 * TanStack Router's useNavigate/useLocation/useRouter hooks.
 */
export function usePathname(): string {
    return useLocation({ select: (state) => state.pathname });
}

export function useSearchParams(): URLSearchParams {
    const searchStr = useLocation({ select: (state) => state.searchStr });
    return useMemo(() => new URLSearchParams(searchStr), [searchStr]);
}

const isExternal = (to: string): boolean =>
    /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(to);

/**
 * `next/navigation` accepted `"/products?category=shoes"` as a single string.
 * TanStack Router needs the pathname and the search object separately: passing
 * the whole string as `to` makes buildLocation treat the query as part of the
 * pathname and produces `search: {}`, so route matching/loaderDeps see no
 * filters. Splitting here keeps every existing call site working.
 */
export function parseNavigationTarget(to: string, pathname: string) {
    const [pathAndQuery, hash] = to.split("#");
    const [rawPath, rawQuery] = pathAndQuery.split("?");
    return {
        to: rawPath || pathname,
        search:
            rawQuery === undefined
                ? undefined
                : Object.fromEntries(new URLSearchParams(rawQuery)),
        hash: hash || undefined,
    };
}

export function useRouter() {
    const navigate = useNavigate();
    const router = useTanStackRouter();
    const pathname = usePathname();

    return useMemo(() => {
        const go = (target: string, replace: boolean) => {
            if (isExternal(target)) {
                if (replace) window.location.replace(target);
                else window.location.assign(target);
                return;
            }
            const parsed = parseNavigationTarget(target, pathname);
            navigate({
                to: parsed.to as never,
                ...(parsed.search ? { search: parsed.search as never } : {}),
                ...(parsed.hash ? { hash: parsed.hash } : {}),
                ...(replace ? { replace: true } : {}),
            });
        };

        return {
            push: (to: string) => go(to, false),
            replace: (to: string) => go(to, true),
            refresh: () => router.invalidate(),
            back: () => router.history.back(),
            forward: () => router.history.forward(),
            prefetch: () => {},
        };
    }, [navigate, pathname, router]);
}
