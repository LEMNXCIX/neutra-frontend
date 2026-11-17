// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "XCIX - Tu plataforma de negocios" },
            {
                name: "description",
                content:
                    "Soluciones de comercio electrónico y reservas en una sola plataforma",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/" />;
}
