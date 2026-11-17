import { createFileRoute } from "@tanstack/react-router";
import { BusinessHoursClient } from "@/components/admin/tenants/BusinessHoursClient";

export const Route = createFileRoute("/_bookingAdmin/booking-admin/hours/")({
    head: () => ({
        meta: [
            { title: "Horario" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: BookingAdminHoursRoute,
});

function BookingAdminHoursRoute() {
    return <BusinessHoursClient />;
}
