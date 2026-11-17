import {
    createRootRoute,
    HeadContent,
    Outlet,
    Scripts,
} from "@tanstack/react-router";
import { AuthInitializer } from "@/components/auth-initializer";
import { SWRegistration } from "@/components/sw-registration";
import { Toaster } from "@/components/ui/sonner";
import { FeatureProvider } from "@/providers/feature-provider";
import { QueryProvider } from "@/providers/query-provider";
import { TenantThemeProvider } from "@/providers/tenant-theme-provider";
import { ThemeProvider } from "@/providers/theme-provider";

/**
 * The document shell used by TanStack Start for every request. `children` is
 * the routed tree supplied by the framework; the local `<Outlet />` fallback
 * keeps the component renderable in isolation (and in unit tests).
 */
export function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
                />
                <HeadContent />
                <script
                    dangerouslySetInnerHTML={{
                        __html: 'try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark")}catch(e){}',
                    }}
                />
            </head>
            <body className="font-sans antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TenantThemeProvider>
                        <FeatureProvider>
                            <SWRegistration />
                            <AuthInitializer />
                            <QueryProvider>
                                {children ?? <Outlet />}
                                <Toaster richColors />
                            </QueryProvider>
                        </FeatureProvider>
                    </TenantThemeProvider>
                </ThemeProvider>
                <Scripts />
            </body>
        </html>
    );
}

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            { title: "XCIX - Tu plataforma de negocios" },
            {
                name: "description",
                content:
                    "Comercio electrónico y reservas en una sola plataforma",
            },
        ],
        links: [{ rel: "icon", href: "/icon.svg" }],
    }),
    shellComponent: RootDocument,
});
