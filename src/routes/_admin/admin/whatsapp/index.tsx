// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/whatsapp/")({
    head: () => ({
        meta: [
            { title: "WhatsApp Configuration | Admin" },
            {
                name: "description",
                content: "Gestiona la integración con WhatsApp Business API",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_admin/admin/whatsapp/" />;
}
