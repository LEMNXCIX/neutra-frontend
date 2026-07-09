import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthInitializer } from "@/components/auth-initializer";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { FeatureProvider } from "@/providers/feature-provider";
import { SWRegistration } from "@/components/sw-registration";
import { ProgressBar } from "@/components/ui/progress-bar";

const geist = Geist({
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "XCIX - Your Business Platform",
    description: "E-Commerce and Booking solutions in one platform",
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`${geist.className} antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
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
                </ThemeProvider>
            </body>
        </html>
    );
}
