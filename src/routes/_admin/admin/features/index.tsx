import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { FeaturesTable } from "@/components/admin/features/FeaturesTable";

const getFeaturesData = createServerFn({ method: "GET" }).handler(async () => {
    const { api } = await import("@/lib/api-client");
    try {
        const features = await api.get<any[]>("/features");
        return { features };
    } catch (error) {
        console.error("Error fetching features on server:", error);
        return { features: [] as any[] };
    }
});

export const Route = createFileRoute("/_admin/admin/features/")({
    loader: () => getFeaturesData(),
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: AdminFeaturesRoute,
});

function AdminFeaturesRoute() {
    const { features } = Route.useLoaderData();
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Platform Features
                </h1>
                <p className="text-muted-foreground">
                    Gestiona y define el precio de las funcionalidades
                    disponibles para todos los tenants.
                </p>
            </div>
            <FeaturesTable initialFeatures={features} />
        </div>
    );
}
