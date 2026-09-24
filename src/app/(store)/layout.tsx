import { headers } from "next/headers";
import { Navigation as NavBar } from "@/components/nav_bar";
import { NeutralNavigation } from "@/components/neutral-navigation";
import FooterWrapper from "@/components/footer-wrapper";
import { TenantThemeProvider } from "@/providers/tenant-theme-provider";
import {
    getTenantBrandingFromHeaders,
    getTenantNameFromHeaders,
} from "@/lib/server-theme";
import { getHomeContent } from "@/lib/strapi";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Explorá nuestros productos y servicios",
};

export default async function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const requestHeaders = await headers();
    const isSuperAdmin =
        requestHeaders.get("x-tenant-slug") === "superadmin";

    const [branding, tenantName, cms] = await Promise.all([
        getTenantBrandingFromHeaders(),
        getTenantNameFromHeaders(),
        getHomeContent(),
    ]);

    return (
        <TenantThemeProvider branding={branding}>
            <div
                id="root-content"
                className="transition-all duration-300 ease-in-out"
                style={{
                    marginLeft: 'var(--sidebar-width, 0px)',
                } as React.CSSProperties}
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
                <div
                    className={
                        isSuperAdmin
                            ? "print:pt-0"
                            : "pt-16 print:pt-0"
                    }
                >
                    {children}
                </div>
                <div className="print:hidden">
                <FooterWrapper
                    minimal={isSuperAdmin}
                    tenantName={
                        isSuperAdmin ? "Neutra SuperAdmin" : tenantName
                    }
                    tenantLogo={branding?.tenantLogo}
                    footerDescription={cms?.footerDescription}
                    socialLinks={cms?.socialLinks}
                />
                </div>
            </div>
        </TenantThemeProvider>
    );
}
