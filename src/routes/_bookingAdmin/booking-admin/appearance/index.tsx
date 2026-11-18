import { createFileRoute } from "@tanstack/react-router";
import { AppearanceClient } from "@/components/admin/tenants/AppearanceClient";

export const Route = createFileRoute(
    "/_bookingAdmin/booking-admin/appearance/",
)({
    head: () => ({
        meta: [
            { title: "Apariencia" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: BookingAdminAppearanceRoute,
});

function BookingAdminAppearanceRoute() {
    return <AppearanceClient />;
}
