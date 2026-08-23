"use client";

import { useEffect } from "react";
import { applyTenantTheme, clearTenantTheme } from "@/lib/theme";
import type { TenantBranding } from "@/types/tenant";

interface TenantThemeProviderProps {
    branding?: TenantBranding | null;
    children: React.ReactNode;
}

/**
 * Branding colors are applied as inline styles on <html>, which take
 * precedence over the .dark stylesheet rules. Since custom brand palettes
 * are designed for light backgrounds, dark mode is forced off while a
 * tenant theme is active.
 */
function setDarkMode(enabled: boolean): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    let stored: string | null = null;
    try {
        stored = localStorage.getItem("theme");
    } catch {
        // localStorage may be unavailable (private mode)
    }

    if (enabled) {
        root.classList.remove("dark");
    } else {
        // Restore next-themes preference
        const systemDark =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-color-scheme: dark)").matches;
        if (stored === "dark" || (!stored && systemDark)) {
            root.classList.add("dark");
        }
    }
}

export function TenantThemeProvider({
    branding,
    children,
}: TenantThemeProviderProps) {
    useEffect(() => {
        applyTenantTheme(branding);
        const hasTheme = !!branding && Object.keys(branding).length > 0;
        if (hasTheme) {
            document.documentElement.classList.add("tenant-theme");
        }
        setDarkMode(hasTheme);
        return () => {
            clearTenantTheme();
            document.documentElement.classList.remove("tenant-theme");
            setDarkMode(false);
        };
    }, [branding]);

    return <>{children}</>;
}

