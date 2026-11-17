import { createFileRoute, Outlet } from "@tanstack/react-router";
import SuperAdminMobileNav from "@/components/admin/SuperAdminMobileNav";
import SuperAdminSidebar from "@/components/admin/SuperAdminSidebar";
import { NeutralNavigation } from "@/components/neutral-navigation";
import { SUPER_ADMIN_NAV } from "@/config/admin-navigation";

/** Pathless replacement for the App Router `admin` layout. */
export const Route = createFileRoute("/_admin")({
    component: AdminLayout,
});

function AdminLayout() {
    return (
        <div className="flex flex-col min-h-screen transition-colors duration-300">
            <NeutralNavigation />
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 bg-background">
                <SuperAdminSidebar items={SUPER_ADMIN_NAV} />

                <main className="flex-1 p-6 overflow-y-auto pb-20 md:pb-6 transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 bg-background">
                    <Outlet />
                </main>

                <SuperAdminMobileNav items={SUPER_ADMIN_NAV} />
            </div>
        </div>
    );
}
