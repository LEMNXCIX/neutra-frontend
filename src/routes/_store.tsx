import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import FooterWrapper from "@/components/footer-wrapper";
import { Navigation as NavBar } from "@/components/nav_bar";
import { NeutralNavigation } from "@/components/neutral-navigation";
import { NotFound } from "@/components/not-found";

/** Server-only data for the storefront shell. Dynamic imports keep these
 *  modules out of the client bundle; the RPC boundary is Start's stable API. */
const getStoreLayoutData = createServerFn({ method: "GET" }).handler(
    async () => {
        const [{ getRequestHeader }, serverTheme, { getHomeContent }] =
            await Promise.all([
                import("@tanstack/react-start/server"),
                import("@/lib/server-theme"),
                import("@/lib/strapi"),
            ]);
        // The proxy injects this header for this request; a stale tenant
        // cookie must not change which navigation the storefront renders.
        // A missing header is a root/superadmin surface, NOT a store tenant:
        // otherwise an unproxied/SSR-only call would show the store navbar on
        // the root host.
        const tenantSlug = getRequestHeader("x-tenant-slug");
        const isSuperAdmin = !tenantSlug || tenantSlug === "superadmin";
        const [branding, tenantName, cms] = await Promise.all([
            serverTheme.getTenantBrandingFromHeaders(),
            serverTheme.getTenantNameFromHeaders(),
            getHomeContent(),
        ]);
        return { isSuperAdmin, branding, tenantName, cms };
    },
);

/** Pathless replacement for the App Router `(store)` group. */
export const Route = createFileRoute("/_store")({
    loader: () => getStoreLayoutData(),
    notFoundComponent: StoreNotFound,
    component: StoreLayout,
});

/** Keep the tenant shell on 404s, matching Next's root not-found.tsx. */
function StoreNotFound() {
    const { isSuperAdmin, branding, tenantName, cms } = Route.useLoaderData();
    return (
        <div
            id="root-content"
            className="transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 ease-in-out"
            style={{ marginLeft: "var(--sidebar-width, 0px)" }}
        >
            <div className="print:hidden">
                {isSuperAdmin ? (
                    <NeutralNavigation />
                ) : (
                    <NavBar
                        tenantName={tenantName}
                        tenantLogo={branding?.tenantLogo}
                    />
                )}
            </div>
            <NotFound />
            <div className="print:hidden">
                <FooterWrapper
                    minimal={isSuperAdmin}
                    tenantName={isSuperAdmin ? "Neutra SuperAdmin" : tenantName}
                    tenantLogo={branding?.tenantLogo}
                    footerDescription={cms?.footerDescription}
                    socialLinks={cms?.socialLinks}
                />
            </div>
        </div>
    );
}

function StoreLayout() {
    const { isSuperAdmin, branding, tenantName, cms } = Route.useLoaderData();

    return (
        <div
            id="root-content"
            className="transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 ease-in-out"
            style={{ marginLeft: "var(--sidebar-width, 0px)" }}
        >
            <div className="print:hidden">
                {isSuperAdmin ? (
                    <NeutralNavigation />
                ) : (
                    <NavBar
                        tenantName={tenantName}
                        tenantLogo={branding?.tenantLogo}
                    />
                )}
            </div>
            <div className={isSuperAdmin ? "print:pt-0" : "pt-16 print:pt-0"}>
                <Outlet />
            </div>
            <div className="print:hidden">
                <FooterWrapper
                    minimal={isSuperAdmin}
                    tenantName={isSuperAdmin ? "Neutra SuperAdmin" : tenantName}
                    tenantLogo={branding?.tenantLogo}
                    footerDescription={cms?.footerDescription}
                    socialLinks={cms?.socialLinks}
                />
            </div>
        </div>
    );
}
