"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

/**
 * Local replacement for next-themes. It keeps the same public surface used by
 * the app (`theme`, `setTheme`, `resolvedTheme`), the same `theme` localStorage
 * key and the same `.dark` class on <html>; no visual behaviour changes.
 */
export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
};

const STORAGE_KEY = "theme";
const isTheme = (value: unknown): value is Theme =>
    value === "light" || value === "dark" || value === "system";

const systemPrefersDark = (): boolean =>
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;

const applyDarkClass = (dark: boolean): void => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
};

const ThemeContext = createContext<ThemeContextValue>({
    theme: "system",
    setTheme: () => {},
    resolvedTheme: "light",
});

export type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    /** Kept for parity with the previous provider; class is always the attribute. */
    attribute?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
    children,
    defaultTheme = "system",
    disableTransitionOnChange = false,
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
        systemPrefersDark() ? "dark" : "light",
    );

    // Rehydrate the persisted preference after mount (the server cannot read
    // localStorage). The root document has suppressHydrationWarning for this.
    useEffect(() => {
        let stored: string | null = null;
        try {
            stored = localStorage.getItem(STORAGE_KEY);
        } catch {
            // Storage may be unavailable (private mode).
        }
        setThemeState(isTheme(stored) ? stored : defaultTheme);
    }, [defaultTheme]);

    useEffect(() => {
        const resolved =
            theme === "system"
                ? systemPrefersDark()
                    ? "dark"
                    : "light"
                : theme;
        setResolvedTheme(resolved);
        applyDarkClass(resolved === "dark");
    }, [theme]);

    useEffect(() => {
        if (theme !== "system" || typeof window === "undefined") return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => {
            const resolved = media.matches ? "dark" : "light";
            setResolvedTheme(resolved);
            applyDarkClass(resolved === "dark");
        };
        media.addEventListener?.("change", onChange);
        return () => media.removeEventListener?.("change", onChange);
    }, [theme]);

    const setTheme = useCallback(
        (next: Theme) => {
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch {
                // Storage may be unavailable (private mode).
            }
            if (disableTransitionOnChange && typeof document !== "undefined") {
                const root = document.documentElement;
                root.classList.add("theme-transition-disabled");
                requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                        root.classList.remove("theme-transition-disabled"),
                    ),
                );
            }
            setThemeState(next);
        },
        [disableTransitionOnChange],
    );

    const value = useMemo(
        () => ({ theme, setTheme, resolvedTheme }),
        [theme, setTheme, resolvedTheme],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
