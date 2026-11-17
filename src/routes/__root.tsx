import {
    createRootRoute,
    HeadContent,
    Link,
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

function NotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                404
            </p>
            <h1 className="text-2xl font-bold text-foreground">
                Página no encontrada
            </h1>
            <p className="max-w-md text-muted-foreground">
                La página que buscás no existe o fue movida.
            </p>
            <Link
                to="/"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
                Volver al inicio
            </Link>
        </main>
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
            { name: "theme-color", content: "#000000" },
        ],
        links: [
            { rel: "icon", href: "/icon.svg" },
            { rel: "manifest", href: "/manifest.webmanifest" },
        ],
    }),
    notFoundComponent: NotFound,
    shellComponent: RootDocument,
});
