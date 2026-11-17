// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
    "/_bookingAdmin/booking-admin/categories/",
)({
    head: () => ({
        meta: [
            { title: "Categorías de reservas" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_bookingAdmin/booking-admin/categories/" />;
}
