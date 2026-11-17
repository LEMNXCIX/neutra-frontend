import {
    createRootRoute,
    HeadContent,
    Outlet,
    Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/providers/query-provider";
import { TenantThemeProvider } from "@/providers/tenant-theme-provider";

/**
 * The document shell used by TanStack Start for every request. `children` is
 * the routed tree supplied by the framework; the local `<Outlet />` fallback
 * keeps the component renderable in isolation (and in unit tests).
 */
export function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body className="font-sans antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TenantThemeProvider>
                        <QueryProvider>{children ?? <Outlet />}</QueryProvider>
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
