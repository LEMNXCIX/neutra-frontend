import { BookingNavbar } from '@/components/booking/booking-navbar';
import { TenantThemeProvider } from '@/providers/tenant-theme-provider';
import { getTenantBrandingFromHeaders } from '@/lib/server-theme';
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
    const branding = await getTenantBrandingFromHeaders();

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
