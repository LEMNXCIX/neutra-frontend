// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/tenants/")({
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_admin/admin/tenants/" />;
}
