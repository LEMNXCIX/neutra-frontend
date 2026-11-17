// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/")({
    head: () => ({
        meta: [
            { title: "Mi Perfil" },
            {
                name: "description",
                content:
                    "Gestiona la configuración y preferencias de tu cuenta",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/profile/" />;
}
