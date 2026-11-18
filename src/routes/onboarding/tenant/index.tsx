import { createFileRoute } from "@tanstack/react-router";
import { TenantOnboardingPageClient } from "@/app/onboarding/tenant/tenant-onboarding-client";

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
    component: TenantOnboardingRoute,
});

function TenantOnboardingRoute() {
    return <TenantOnboardingPageClient />;
}
