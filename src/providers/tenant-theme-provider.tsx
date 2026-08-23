"use client";

import { useEffect } from "react";
import { applyTenantTheme, clearTenantTheme } from "@/lib/theme";
import type { TenantBranding } from "@/types/tenant";

interface TenantThemeProviderProps {
    branding?: TenantBranding | null;
    children: React.ReactNode;
}

export function TenantThemeProvider({
    branding,
    children,
}: TenantThemeProviderProps) {
    useEffect(() => {
        applyTenantTheme(branding);
        if (branding && Object.keys(branding).length > 0) {
            document.documentElement.classList.add("tenant-theme");
        }
        return () => {
            clearTenantTheme();
            document.documentElement.classList.remove("tenant-theme");
        };
    }, [branding]);

    return <>{children}</>;
}
