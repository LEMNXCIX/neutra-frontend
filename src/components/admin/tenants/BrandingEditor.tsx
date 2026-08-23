"use client";

import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    applyTenantTheme,
    clearTenantTheme,
    ensureFontLoaded,
    DEFAULT_BRANDING,
} from "@/lib/theme";
import type { TenantBranding } from "@/types/tenant";

interface BrandingEditorProps {
    value?: TenantBranding;
    onChange: (branding: TenantBranding) => void;
    /** Apply branding to the whole document while editing */
    livePreview?: boolean;
}

interface ColorFieldProps {
    label: string;
    value?: string;
    onChange: (hex: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Input
                    type="color"
                    aria-label={`${label} color picker`}
                    className="size-12 p-1 cursor-pointer"
                    value={value || "#000000"}
                    onChange={(e) => onChange(e.target.value)}
                />
                <Input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}

function RadiusSlider({
    value,
    onChange,
}: {
    value?: string;
    onChange: (radius: string) => void;
}) {
    const rem = parseFloat(value || DEFAULT_BRANDING.radius) || 0;

    return (
        <div className="space-y-2">
            <Label>
                Radius ({rem.toFixed(2)}rem)
            </Label>
            <input
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={rem}
                aria-label="Corner radius"
                className="w-full accent-primary cursor-pointer"
                onChange={(e) => onChange(`${Number(e.target.value).toFixed(2)}rem`)}
            />
        </div>
    );
}

/** Common font suggestions (loaded on demand from Google Fonts) */
const FONT_SUGGESTIONS = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Playfair Display",
    "Merriweather",
    "Space Grotesk",
    "DM Sans",
    "Bebas Neue",
    "JetBrains Mono",
];

function FontField({
    label,
    hint,
    value,
    onChange,
}: {
    label: string;
    hint?: string;
    value?: string;
    onChange: (family: string) => void;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Font family name"
                list={`font-suggestions-${label.replace(/\s+/g, "-").toLowerCase()}`}
            />
            <datalist
                id={`font-suggestions-${label.replace(/\s+/g, "-").toLowerCase()}`}
            >
                {FONT_SUGGESTIONS.map((f) => (
                    <option key={f} value={f} />
                ))}
            </datalist>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

/** Isolated preview that renders using the edited branding, not the global theme */
function BrandingPreview({ branding }: { branding: TenantBranding }) {
    const b = { ...DEFAULT_BRANDING, ...branding };

    const vars = {
        "--preview-primary": b.primaryColor,
        "--preview-primary-foreground": b.primaryForeground,
        "--preview-secondary": b.secondaryColor,
        "--preview-secondary-foreground": b.secondaryForeground,
        "--preview-background": b.background,
        "--preview-foreground": b.foreground,
        "--preview-muted": b.muted,
        "--preview-muted-foreground": b.mutedForeground,
        "--preview-accent": b.accent,
        "--preview-destructive": b.destructive,
        "--preview-border": b.border,
        "--preview-radius": b.radius,
    } as React.CSSProperties;

    const bodyFont = b.fontFamily ? `"${b.fontFamily}", sans-serif` : undefined;
    const headingFont = b.headingFont
        ? `"${b.headingFont}", ${bodyFont ?? "sans-serif"}`
        : bodyFont;

    return (
        <Card
            className="overflow-hidden"
            style={{
                backgroundColor: b.background,
                color: b.foreground,
                borderColor: b.border,
                fontFamily: bodyFont,
            }}
        >
            <CardContent className="space-y-4" style={vars}>
                {(b.tenantLogo || b.favicon) && (
                    <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${b.border}` }}>
                        {b.tenantLogo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={b.tenantLogo}
                                alt="Tenant logo preview"
                                className="h-10 w-auto object-contain"
                            />
                        )}
                        {b.favicon && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.favicon} alt="Favicon preview" className="size-5" />
                        )}
                    </div>
                )}

                <p className="text-sm font-semibold" style={{ fontFamily: headingFont }}>
                    Preview
                </p>
                <p className="text-lg font-bold tracking-tight" style={{ fontFamily: headingFont }}>
                    Headings look like this (H2)
                </p>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        style={{
                            backgroundColor: b.primaryColor,
                            color: b.primaryForeground,
                            borderRadius: b.radius,
                        }}
                        className="pointer-events-none"
                    >
                        Primary
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        style={{
                            color: b.foreground,
                            borderColor: b.border,
                            borderRadius: b.radius,
                            backgroundColor: "transparent",
                        }}
                        className="pointer-events-none"
                    >
                        Outline
                    </Button>
                    <Badge
                        style={{
                            backgroundColor: b.secondaryColor,
                            color: b.secondaryForeground,
                            borderRadius: b.radius,
                        }}
                    >
                        Secondary
                    </Badge>
                    <Badge
                        style={{
                            backgroundColor: b.accent,
                            color: b.accentForeground,
                            borderRadius: b.radius,
                        }}
                    >
                        Accent
                    </Badge>
                    <Badge
                        style={{
                            backgroundColor: b.destructive,
                            color: "#ffffff",
                            borderRadius: b.radius,
                        }}
                    >
                        Destructive
                    </Badge>
                </div>

                <div className="space-y-1">
                    <Label style={{ color: b.foreground }}>Email</Label>
                    <Input
                        readOnly
                        placeholder="you@example.com"
                        className="pointer-events-none bg-transparent"
                        style={{
                            borderColor: b.border,
                            color: b.foreground,
                            borderRadius: b.radius,
                        }}
                    />
                    <p className="text-xs" style={{ color: b.mutedForeground }}>
                        Helper text uses muted foreground.
                    </p>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: b.muted, borderRadius: b.radius }}>
                    <p className="text-xs font-medium" style={{ color: b.mutedForeground }}>
                        Muted surface block
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export function BrandingEditor({
    value,
    onChange,
    livePreview = false,
}: BrandingEditorProps) {
    const branding = value ?? {};

    const set = (key: keyof TenantBranding, v: string | undefined) =>
        onChange({ ...branding, [key]: v });

    useEffect(() => {
        if (!livePreview) return;
        applyTenantTheme(branding);
        return () => clearTenantTheme();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [livePreview, JSON.stringify(branding)]);

    // Always load preview fonts, even without live document theming
    useEffect(() => {
        if (branding.fontFamily?.trim()) ensureFontLoaded(branding.fontFamily);
        if (branding.headingFont?.trim())
            ensureFontLoaded(branding.headingFont);
    }, [branding.fontFamily, branding.headingFont]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <ColorField
                    label="Primary Color"
                    value={branding.primaryColor}
                    onChange={(v) => set("primaryColor", v)}
                />
                <ColorField
                    label="Primary Foreground"
                    value={branding.primaryForeground}
                    onChange={(v) => set("primaryForeground", v)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorField
                        label="Background"
                        value={branding.background}
                        onChange={(v) => set("background", v)}
                    />
                    <ColorField
                        label="Foreground"
                        value={branding.foreground}
                        onChange={(v) => set("foreground", v)}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorField
                        label="Secondary"
                        value={branding.secondaryColor}
                        onChange={(v) => set("secondaryColor", v)}
                    />
                    <ColorField
                        label="Secondary Foreground"
                        value={branding.secondaryForeground}
                        onChange={(v) => set("secondaryForeground", v)}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorField
                        label="Muted"
                        value={branding.muted}
                        onChange={(v) => set("muted", v)}
                    />
                    <ColorField
                        label="Muted Foreground"
                        value={branding.mutedForeground}
                        onChange={(v) => set("mutedForeground", v)}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorField
                        label="Accent"
                        value={branding.accent}
                        onChange={(v) => set("accent", v)}
                    />
                    <ColorField
                        label="Accent Foreground"
                        value={branding.accentForeground}
                        onChange={(v) => set("accentForeground", v)}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorField
                        label="Destructive"
                        value={branding.destructive}
                        onChange={(v) => set("destructive", v)}
                    />
                    <ColorField
                        label="Border"
                        value={branding.border}
                        onChange={(v) => set("border", v)}
                    />
                </div>

                <RadiusSlider
                    value={branding.radius}
                    onChange={(v) => set("radius", v)}
                />

                <div className="space-y-4 pt-2 border-t">
                    <p className="text-sm font-semibold">Typography</p>
                    <FontField
                        label="Body Font"
                        hint="Applied to all general text. Loaded from Google Fonts by family name."
                        value={branding.fontFamily}
                        onChange={(v) => set("fontFamily", v)}
                    />
                    <FontField
                        label="Heading Font"
                        hint="Applied to titles/headings. Leave empty to reuse the body font."
                        value={branding.headingFont}
                        onChange={(v) => set("headingFont", v)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                        value={branding.tenantLogo || ""}
                        onChange={(e) => set("tenantLogo", e.target.value)}
                        placeholder="https://example.com/logo.png"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <Input
                        value={branding.favicon || ""}
                        onChange={(e) => set("favicon", e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                    />
                </div>
            </div>

            <div>
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base">Live Preview</CardTitle>
                </CardHeader>
                <BrandingPreview branding={branding} />
            </div>
        </div>
    );
}
