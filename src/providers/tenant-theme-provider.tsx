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
        return () => clearTenantTheme();
    }, [branding]);

    return <>{children}</>;
}
