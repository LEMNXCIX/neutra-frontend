import { createFileRoute } from "@tanstack/react-router";
import { LandingPageClient } from "@/app/landing-client";

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
    component: LandingRoute,
});

function LandingRoute() {
    return <LandingPageClient />;
}
