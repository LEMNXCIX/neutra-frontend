import { Navigation as NavBar } from "@/components/nav_bar";
import FooterWrapper from "@/components/footer-wrapper";
import { TenantThemeProvider } from "@/providers/tenant-theme-provider";
import { tenantService } from "@/services/tenant.service";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Store",
  description: "Browse our products and services",
};

export default async function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tenantSlug = (await headers()).get("x-tenant-slug");
    let branding = null;

    if (tenantSlug) {
        try {
            const tenant = await tenantService.getBySlug(tenantSlug);
            branding = tenant?.config?.branding ?? null;
        } catch {
            // Theme is decorative: never block rendering on fetch errors
        }
    }

    return (
        <TenantThemeProvider branding={branding}>
            <div
                id="root-content"
                className="transition-all duration-300 ease-in-out"
                style={{
                    marginLeft: 'var(--sidebar-width, 0px)',
                } as React.CSSProperties}
            >
                <NavBar />
                <div className="pt-16">{children}</div>
                <FooterWrapper />
            </div>
        </TenantThemeProvider>
    );
}
