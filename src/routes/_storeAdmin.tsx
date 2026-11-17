import { createFileRoute, Outlet } from "@tanstack/react-router";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Navigation as StoreNavbar } from "@/components/nav_bar";
import { STORE_ADMIN_NAV } from "@/config/admin-navigation";

/** Pathless replacement for the App Router `store-admin` layout. */
export const Route = createFileRoute("/_storeAdmin")({
    component: StoreAdminLayout,
});

function StoreAdminLayout() {
    return (
        <div className="flex flex-col min-h-screen transition-colors duration-300">
            <StoreNavbar />
            <div className="flex flex-1 flex-col md:flex-row pt-20 border rounded-md overflow-hidden shadow-sm transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 bg-background">
                <AdminSidebar items={STORE_ADMIN_NAV} />

                <main className="flex-1 p-6 overflow-y-auto pb-20 md:pb-6 transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 bg-background">
                    <Outlet />
                </main>

                <AdminMobileNav items={STORE_ADMIN_NAV} />
            </div>
        </div>
    );
}
