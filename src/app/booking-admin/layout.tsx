import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { BOOKING_ADMIN_NAV } from "@/config/admin-navigation";
import { BookingNavbar } from "@/components/booking/booking-navbar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <BookingNavbar />
            <div className="flex flex-1 flex-col md:flex-row pt-2 border rounded-md overflow-hidden shadow-sm transition-all duration-300 container mx-auto my-4">
                <AdminSidebar items={BOOKING_ADMIN_NAV} />

                <main className="flex-1 p-6 overflow-y-auto pb-20 md:pb-6 transition-all duration-300 bg-background">
                    {children}
                </main>

                <AdminMobileNav items={BOOKING_ADMIN_NAV} />
            </div>
        </div>
    );
}
