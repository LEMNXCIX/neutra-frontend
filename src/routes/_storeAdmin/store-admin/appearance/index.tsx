import { createFileRoute } from "@tanstack/react-router";
import { AppearanceClient } from "@/components/admin/tenants/AppearanceClient";

export const Route = createFileRoute("/_storeAdmin/store-admin/appearance/")({
    head: () => ({
        meta: [
            { title: "Apariencia" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: StoreAdminAppearanceRoute,
});

function StoreAdminAppearanceRoute() {
    return <AppearanceClient />;
}
