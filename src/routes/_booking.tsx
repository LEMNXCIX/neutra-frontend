import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { BookingNavbar } from "@/components/booking/booking-navbar";

/** Server-only tenant data for the booking shell (RPC boundary + dynamic
 *  imports keep server helpers out of the client bundle). */
const getBookingLayoutData = createServerFn({ method: "GET" }).handler(
    async () => {
        const { getTenantBrandingFromHeaders, getTenantNameFromHeaders } =
            await import("@/lib/server-theme");
        const [branding, tenantName] = await Promise.all([
            getTenantBrandingFromHeaders(),
            getTenantNameFromHeaders(),
        ]);
        return { branding, tenantName };
    },
);

/** Pathless replacement for the App Router `(booking)` group. */
export const Route = createFileRoute("/_booking")({
    loader: () => getBookingLayoutData(),
    component: BookingLayout,
});

function BookingLayout() {
    const { branding, tenantName } = Route.useLoaderData();

    return (
        <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
            <BookingNavbar
                tenantName={tenantName}
                tenantLogo={branding?.tenantLogo}
            />
            <main className="flex-1 pt-16">
                <Outlet />
            </main>
            <footer className="border-t border-border py-6 px-6">
                <p className="text-[10px] text-muted-foreground text-center font-semibold uppercase tracking-widest">
                    &copy; {new Date().getFullYear()}{" "}
                    {tenantName || "XCIX Platforms"}. Todos los derechos
                    reservados.
                </p>
            </footer>
        </div>
    );
}
