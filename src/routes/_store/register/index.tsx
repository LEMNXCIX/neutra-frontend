// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/register/")({
    head: () => ({
        meta: [
            { title: "Registrarse" },
            {
                name: "description",
                content: "Crear una nueva cuenta",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_store/register/" />;
}
