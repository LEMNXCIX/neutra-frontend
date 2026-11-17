// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
    "/_bookingAdmin/booking-admin/appointments/$id/reject/",
)({
    head: () => ({
        meta: [
            { title: "Rechazar cita" },
            {
                name: "description",
                content: "Procesando el rechazo de la cita",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return (
        <div data-route="/_bookingAdmin/booking-admin/appointments/$id/reject/" />
    );
}
