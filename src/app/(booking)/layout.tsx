import { BookingNavbar } from '@/components/booking/booking-navbar';
import { TenantThemeProvider } from '@/providers/tenant-theme-provider';
import { tenantService } from '@/services/tenant.service';
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Bookings",
  description: "Book appointments and services",
};

export default async function BookingLayout({
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
            <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
                <BookingNavbar />
                <main className="flex-1 pt-16">
                    {children}
                </main>
            </div>
        </TenantThemeProvider>
    );
}
