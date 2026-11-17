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

export function useRouter() {
    const navigate = useNavigate();
    const router = useTanStackRouter();
    const pathname = usePathname();

    return useMemo(
        () => ({
            push: (to: string) => {
                if (isExternal(to)) {
                    window.location.assign(to);
                    return;
                }
                navigate({
                    to: (to.startsWith("?") ? `${pathname}${to}` : to) as never,
                });
            },
            replace: (to: string) => {
                if (isExternal(to)) {
                    window.location.replace(to);
                    return;
                }
                navigate({
                    to: (to.startsWith("?") ? `${pathname}${to}` : to) as never,
                    replace: true,
                });
            },
            refresh: () => router.invalidate(),
            back: () => router.history.back(),
            forward: () => router.history.forward(),
            prefetch: () => {},
        }),
        [navigate, pathname, router],
    );
}
