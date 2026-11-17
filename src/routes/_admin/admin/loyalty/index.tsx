import { createFileRoute } from "@tanstack/react-router";
import { SuperAdminLoyaltyClient } from "@/components/admin/loyalty/SuperAdminLoyaltyClient";

export const Route = createFileRoute("/_admin/admin/loyalty/")({
    head: () => ({
        meta: [
            { title: "Fidelización global | Superadministración" },
            {
                name: "description",
                content:
                    "Consulta las campañas de fidelización de todas las organizaciones",
            },
        ],
    }),
    component: AdminLoyaltyRoute,
});

function AdminLoyaltyRoute() {
    return <SuperAdminLoyaltyClient />;
}
