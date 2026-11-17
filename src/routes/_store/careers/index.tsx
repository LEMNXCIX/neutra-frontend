// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/careers/")({
    head: () => ({
        meta: [
            { title: "Trabaja con Nosotros" },
            {
                name: "description",
                content:
                    "Súmate al equipo y explora oportunidades profesionales",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_store/careers/" />;
}
