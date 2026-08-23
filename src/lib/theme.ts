import type { TenantBranding } from "@/types/tenant";

/**
 * Default branding values (hex).
 *
 * Note: globals.css uses oklch() for the shadcn CSS variables, but we store
 * branding as hex. Runtime overrides are applied as inline styles on
 * <html>, which take precedence over stylesheet rules, so hex works fine
 * without touching the shadcn variable system.
 */
export const DEFAULT_BRANDING: Required<
    Pick<
        TenantBranding,
        | "primaryColor"
        | "primaryForeground"
        | "secondaryColor"
        | "secondaryForeground"
        | "background"
        | "foreground"
        | "muted"
        | "mutedForeground"
        | "accent"
        | "accentForeground"
        | "destructive"
        | "border"
    >
> & { radius: string } = {
    primaryColor: "#171717",
    primaryForeground: "#fafafa",
    secondaryColor: "#f4f4f5",
    secondaryForeground: "#18181b",
    background: "#ffffff",
    foreground: "#18181b",
    muted: "#f4f4f5",
    mutedForeground: "#71717a",
    accent: "#f4f4f5",
    accentForeground: "#18181b",
    destructive: "#e7000b",
    border: "#e5e5e5",
    radius: "0.75rem",
};

const CSS_VAR_MAP: Record<string, string> = {
    primaryColor: "--primary",
    primaryForeground: "--primary-foreground",
    secondaryColor: "--secondary",
    secondaryForeground: "--secondary-foreground",
    background: "--background",
    foreground: "--foreground",
    muted: "--muted",
    mutedForeground: "--muted-foreground",
    accent: "--accent",
    accentForeground: "--accent-foreground",
    destructive: "--destructive",
    border: "--border",
    radius: "--radius",
};

export const THEME_CSS_VARS = Object.values(CSS_VAR_MAP);

/**
 * Apply tenant branding as inline CSS variables on <html>.
 * Falls back to DEFAULT_BRANDING values for any missing token.
 */
export function applyTenantTheme(branding?: TenantBranding | null): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const merged = { ...DEFAULT_BRANDING, ...branding };

    for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
        const value = (merged as Record<string, string | undefined>)[key];
        if (value) root.style.setProperty(cssVar, value);
    }

    // Derived tokens
    root.style.setProperty("--input", merged.border);
    root.style.setProperty("--ring", merged.primaryColor);
}

/** Remove tenant theme overrides, restoring globals.css defaults. */
export function clearTenantTheme(): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    for (const cssVar of THEME_CSS_VARS) {
        root.style.removeProperty(cssVar);
    }
    root.style.removeProperty("--input");
    root.style.removeProperty("--ring");
}
