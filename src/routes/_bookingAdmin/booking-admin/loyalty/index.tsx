import { createFileRoute } from "@tanstack/react-router";
import { TenantLoyaltyClient } from "@/components/admin/loyalty/TenantLoyaltyClient";

export const Route = createFileRoute("/_bookingAdmin/booking-admin/loyalty/")({
    head: () => ({
        meta: [
            { title: "Fidelización | Administración de reservas" },
            {
                name: "description",
                content:
                    "Administra las campañas de fidelización de la organización",
            },
        ],
    }),
    component: BookingAdminLoyaltyRoute,
});

function BookingAdminLoyaltyRoute() {
    return <TenantLoyaltyClient />;
}
