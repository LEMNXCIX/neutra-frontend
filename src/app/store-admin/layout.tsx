import type { Metadata } from "next";
import type React from "react";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Navigation as StoreNavbar } from "@/components/nav_bar";
import { STORE_ADMIN_NAV } from "@/config/admin-navigation";

export const metadata: Metadata = {
    title: "Administración de la Tienda",
    description: "Panel de administración de la tienda",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen transition-colors duration-300">
            <StoreNavbar />
            <div className="flex flex-1 flex-col md:flex-row pt-20 border rounded-md overflow-hidden shadow-sm transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 bg-background">
                <AdminSidebar items={STORE_ADMIN_NAV} />

                <main className="flex-1 p-6 overflow-y-auto pb-20 md:pb-6 transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 bg-background">
                    {children}
                </main>

                <AdminMobileNav items={STORE_ADMIN_NAV} />
            </div>
        </div>
    );
}
