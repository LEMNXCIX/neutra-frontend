import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { TenantsTable } from "@/components/admin/tenants/TenantsTable";

const getTenantsData = createServerFn({ method: "GET" }).handler(async () => {
    const { api } = await import("@/lib/api-client");

    const getTenants = async (): Promise<any[]> => {
        try {
            return (await api.get<any[]>("/tenants")) || [];
        } catch (error) {
            console.error("Error fetching tenants on server:", error);
            return [];
        }
    };
    const getPlatformFeatures = async (): Promise<any[]> => {
        try {
            return (await api.get<any[]>("/features")) || [];
        } catch (error) {
            console.error("Error fetching features on server:", error);
            return [];
        }
    };

    const [tenants, platformFeatures] = await Promise.all([
        getTenants(),
        getPlatformFeatures(),
    ]);
    return { tenants, platformFeatures };
});

export const Route = createFileRoute("/_admin/admin/tenants/")({
    loader: () => getTenantsData(),
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: AdminTenantsRoute,
});

function AdminTenantsRoute() {
    const { tenants, platformFeatures } = Route.useLoaderData();
    return (
        <div className="space-y-6">
            <TenantsTable
                initialTenants={tenants}
                initialPlatformFeatures={platformFeatures}
            />
        </div>
    );
}
