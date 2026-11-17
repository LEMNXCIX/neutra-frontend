// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/forgot-password/")({
    head: () => ({
        meta: [
            { title: "Recuperar Contraseña" },
            {
                name: "description",
                content: "Solicita un enlace para restablecer tu contraseña",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_store/forgot-password/" />;
}
