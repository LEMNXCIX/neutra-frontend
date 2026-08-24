import { BookingNavbar } from '@/components/booking/booking-navbar';
import { TenantThemeProvider } from '@/providers/tenant-theme-provider';
import { getTenantBrandingFromHeaders, getTenantNameFromHeaders } from '@/lib/server-theme';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookings",
  description: "Book appointments and services",
};

export default async function BookingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [branding, tenantName] = await Promise.all([
        getTenantBrandingFromHeaders(),
        getTenantNameFromHeaders(),
    ]);

    return (
        <TenantThemeProvider branding={branding}>
            <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
                <BookingNavbar tenantName={tenantName} tenantLogo={branding?.tenantLogo} />
                <main className="flex-1 pt-16">
                    {children}
                </main>
                <footer className="border-t border-border py-6 px-6">
                    <p className="text-[10px] text-muted-foreground text-center font-semibold uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} {tenantName || "XCIX Platforms"}. All Rights Reserved.
                    </p>
                </footer>
            </div>
        </TenantThemeProvider>
    );
}
