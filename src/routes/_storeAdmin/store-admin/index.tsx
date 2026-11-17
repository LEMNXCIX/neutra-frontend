// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_storeAdmin/store-admin/")({
    head: () => ({
        meta: [
            { title: "Administración de la Tienda" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_storeAdmin/store-admin/" />;
}
