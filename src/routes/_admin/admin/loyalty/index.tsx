// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

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
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_admin/admin/loyalty/" />;
}
