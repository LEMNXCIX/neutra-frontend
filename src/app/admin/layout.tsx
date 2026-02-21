import React from "react";
import SuperAdminSidebar from "@/components/admin/SuperAdminSidebar";
import SuperAdminMobileNav from "@/components/admin/SuperAdminMobileNav";
import { SUPER_ADMIN_NAV } from "@/config/admin-navigation";

import { NeutralNavigation } from "@/components/neutral-navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen transition-colors duration-300">
            <NeutralNavigation />
            <div className="flex flex-1 flex-col md:flex-row border-4 border-foreground rounded-none overflow-hidden transition-all duration-300 bg-background">
                <SuperAdminSidebar items={SUPER_ADMIN_NAV} />

                <main className="flex-1 p-6 overflow-y-auto pb-20 md:pb-6 transition-all duration-300 bg-background">
                    {children}
                </main>

                <SuperAdminMobileNav items={SUPER_ADMIN_NAV} />
            </div>
        </div>
    );
}
