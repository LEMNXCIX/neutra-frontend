// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding/tenant/")({
    head: () => ({
        meta: [
            { title: "Lanzar nueva instancia" },
            {
                name: "description",
                content:
                    "Configura una nueva instancia de negocio en la plataforma",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/onboarding/tenant/" />;
}
