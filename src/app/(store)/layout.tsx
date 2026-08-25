import { Navigation as NavBar } from "@/components/nav_bar";
import FooterWrapper from "@/components/footer-wrapper";
import { TenantThemeProvider } from "@/providers/tenant-theme-provider";
import {
    getTenantBrandingFromHeaders,
    getTenantNameFromHeaders,
} from "@/lib/server-theme";
import { getHomeContent } from "@/lib/strapi";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store",
  description: "Browse our products and services",
};

export default async function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
                    <NavBar tenantName={tenantName} tenantLogo={branding?.tenantLogo} />
                </div>
                <div className="pt-16 print:pt-0">{children}</div>
                <div className="print:hidden">
                <FooterWrapper
                    tenantName={tenantName}
                    tenantLogo={branding?.tenantLogo}
                    footerDescription={cms?.footerDescription}
                    socialLinks={cms?.socialLinks}
                />
                </div>
            </div>
        </TenantThemeProvider>
    );
}
