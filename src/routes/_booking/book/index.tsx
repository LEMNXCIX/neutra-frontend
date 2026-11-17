// Generated from scripts/page-routes.json — page body ports in Tasks 8-9.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_booking/book/")({
    head: () => ({
        meta: [
            { title: "Reservar una Cita" },
            {
                name: "description",
                content: "Agenda tu próxima cita en línea",
            },
        ],
    }),
    component: PageShell,
});

/** Placeholder replaced by the real loader + component in Tasks 8-9. */
function PageShell() {
    return <div data-route="/_booking/book/" />;
}
