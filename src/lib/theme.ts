import type { TenantBranding } from "@/types/tenant";

/**
 * Editor fallback values (hex). Used only to prefill the BrandingEditor UI.
 * Runtime theming applies ONLY the tokens explicitly set by the tenant, so
 * unset tokens keep the site's original palette instead of being hijacked
 * by defaults.
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
 * Tokens not exposed in the editor but affected by dark mode. When a tenant
 * theme is active we pin them to derived values so a leaked `.dark` class
 * (next-themes may re-add it after our provider runs) can't turn cards,
 * popovers or sidebars black on a light branded page.
 */
const DERIVED_SURFACE_VARS: Array<[string, string]> = [
    ["--card", "color-mix(in srgb, var(--background) 97%, var(--foreground))"],
    ["--card-foreground", "var(--foreground)"],
    ["--popover", "var(--background)"],
    ["--popover-foreground", "var(--foreground)"],
    ["--sidebar", "var(--background)"],
    ["--sidebar-foreground", "var(--foreground)"],
    ["--sidebar-primary", "var(--primary)"],
    ["--sidebar-primary-foreground", "var(--primary-foreground)"],
    ["--sidebar-accent", "var(--muted)"],
    ["--sidebar-accent-foreground", "var(--foreground)"],
    ["--sidebar-border", "var(--border)"],
    ["--sidebar-ring", "var(--ring)"],
];

export const ALL_THEME_VARS = [
    ...THEME_CSS_VARS,
    ...DERIVED_SURFACE_VARS.map(([v]) => v),
    "--input",
    "--ring",
];

const FONT_FALLBACKS = 'ui-sans-serif, system-ui, -apple-system, sans-serif';

const FONT_VARS = ["--font-tenant-font", "--font-tenant-heading"];

/**
 * Inject a Google Fonts stylesheet for a font family if not already loaded.
 * Custom fonts are referenced by family name; anything not available as a
 * system font is fetched from Google Fonts. No-op on the server.
 */
export function ensureFontLoaded(family: string): void {
    if (typeof document === "undefined" || !family.trim()) return;

    const id = `tenant-font-${family.toLowerCase().replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
}

/**
 * Apply tenant branding as inline CSS variables on <html>.
 *
 * Only tokens explicitly set in `branding` are overridden; everything else
 * keeps the site's original stylesheet values. Surface-derived tokens
 * (card, popover, sidebar) are always pinned so a leaked `.dark` class
 * cannot produce inconsistent dark surfaces.
 */
export function applyTenantTheme(branding?: TenantBranding | null): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const b = branding ?? {};

    for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
        const value = (b as Record<string, string | undefined>)[key];
        if (value?.trim()) root.style.setProperty(cssVar, value);
    }

    // Derived tokens (only when their source exists)
    if (b.border?.trim()) root.style.setProperty("--input", b.border);
    if (b.primaryColor?.trim()) root.style.setProperty("--ring", b.primaryColor);

    // Pin surface tokens to fight dark-mode leaks
    for (const [cssVar, value] of DERIVED_SURFACE_VARS) {
        root.style.setProperty(cssVar, value);
    }

    // Typography
    const { fontFamily, headingFont } = b;
    if (fontFamily?.trim()) {
        ensureFontLoaded(fontFamily);
        root.style.setProperty(
            "--font-tenant-font",
            `"${fontFamily}", ${FONT_FALLBACKS}`,
        );
    }
    if (headingFont?.trim()) {
        ensureFontLoaded(headingFont);
        root.style.setProperty(
            "--font-tenant-heading",
            `"${headingFont}", ${fontFamily?.trim() ? `"${fontFamily}"` : ""} ${FONT_FALLBACKS}`,
        );
    }
}

/** Remove tenant theme overrides, restoring globals.css defaults. */
export function clearTenantTheme(): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    for (const cssVar of ALL_THEME_VARS) {
        root.style.removeProperty(cssVar);
    }
    for (const cssVar of FONT_VARS) {
        root.style.removeProperty(cssVar);
    }
}
