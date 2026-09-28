import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import "./globals.css";
import { AuthInitializer } from "@/components/auth-initializer";
import { SWRegistration } from "@/components/sw-registration";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Toaster } from "@/components/ui/sonner";
import { getTenantBrandingFromHeaders } from "@/lib/server-theme";
import { FeatureProvider } from "@/providers/feature-provider";
import { QueryProvider } from "@/providers/query-provider";
import { TenantThemeProvider } from "@/providers/tenant-theme-provider";

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});

export const metadata: Metadata = {
    title: "XCIX - Tu plataforma de negocios",
    description: "Comercio electrónico y reservas en una sola plataforma",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "XCIX",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: "/icon.svg",
        apple: "/icon.svg",
    },
};

export const viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Tenant branding is applied here, once, rather than in each surface
    // layout. A root-level not-found.tsx renders inside the root layout only,
    // so when the provider lived in the (store) and (booking) groups the 404
    // fell back to the globals.css palette on a tenant with custom colors.
    const branding = await getTenantBrandingFromHeaders();

    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`${geist.variable} font-sans antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TenantThemeProvider branding={branding}>
                        <FeatureProvider>
                            <SWRegistration />
                            <Suspense fallback={null}>
                                <ProgressBar />
                            </Suspense>
                            <AuthInitializer />
                            <QueryProvider>
                                {children}
                                <Toaster richColors />
                            </QueryProvider>
                        </FeatureProvider>
                    </TenantThemeProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
