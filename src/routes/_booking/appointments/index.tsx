// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_booking/appointments/")({
    head: () => ({
        meta: [
            { title: "Mis citas" },
            {
                name: "description",
                content: "Ver y gestionar tus citas",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_booking/appointments/" />;
}
