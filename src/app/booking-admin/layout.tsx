import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { BOOKING_ADMIN_NAV } from "@/config/admin-navigation";
import { BookingNavbar } from "@/components/booking/booking-navbar";
import type { Metadata } from "next";

import { TenantThemeProvider } from "@/providers/tenant-theme-provider";
import { getTenantBrandingFromHeaders } from "@/lib/server-theme";

export const metadata: Metadata = {
  title: "Administración de reservas",
  description: "Panel de administración de reservas",
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const branding = await getTenantBrandingFromHeaders();

    return (
        <TenantThemeProvider branding={branding}>
            <div className="flex flex-col min-h-screen transition-colors duration-300">
                <BookingNavbar />
                <div className="flex flex-1 flex-col md:flex-row pt-20 border rounded-md overflow-hidden shadow-sm transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 bg-background">
                    <AdminSidebar items={BOOKING_ADMIN_NAV} />

                    <main className="flex-1 p-6 overflow-y-auto pb-20 md:pb-6 transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 bg-background">
                        {children}
                    </main>

                    <AdminMobileNav items={BOOKING_ADMIN_NAV} />
                </div>
            </div>
        </TenantThemeProvider>
    );
}
