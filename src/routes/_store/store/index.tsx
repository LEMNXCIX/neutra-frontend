// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/store/")({
    head: () => ({
        meta: [
            { title: "Inicio" },
            {
                name: "description",
                content:
                    "Bienvenido a nuestra tienda: explora colecciones y productos destacados",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_store/store/" />;
}
