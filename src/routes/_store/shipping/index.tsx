// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/shipping/")({
    head: () => ({
        meta: [
            { title: "Envíos" },
            {
                name: "description",
                content: "Opciones de envío, tiempos de entrega y tarifas",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_store/shipping/" />;
}
