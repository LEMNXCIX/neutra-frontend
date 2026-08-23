import { Navigation as NavBar } from "@/components/nav_bar";
import FooterWrapper from "@/components/footer-wrapper";
import { TenantThemeProvider } from "@/providers/tenant-theme-provider";
import { getTenantBrandingFromHeaders } from "@/lib/server-theme";
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
    const branding = await getTenantBrandingFromHeaders();

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
