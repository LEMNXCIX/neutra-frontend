import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import ServicesTableClient from "@/components/admin/booking/ServicesTableClient";

type Search = { tenantId?: string };

const getGlobalServices = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const [{ api }, { validateAdminAccess }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/lib/server-auth"),
        ]);
        const { isValid } = await validateAdminAccess();
        if (!isValid) return { unauthorized: true as const };

        const tenantId =
            data.tenantId === "all" ? undefined : data.tenantId || "all";
        const query = new URLSearchParams();
        query.append("activeOnly", "false");
        query.append("tenantId", tenantId === undefined ? "all" : tenantId);

        const [servicesData, categoriesData] = await Promise.all([
            api.get<any[]>(`/services?${query.toString()}`).catch(() => []),
            api
                .get<any[]>(`/categories?tenantId=all&type=SERVICE`)
                .catch(() => []),
        ]);
        return { servicesData, categoriesData };
    });

export const Route = createFileRoute("/_admin/admin/services/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        tenantId:
            typeof search.tenantId === "string" ? search.tenantId : undefined,
    }),
    loaderDeps: ({ search }) => ({ tenantId: search.tenantId }),
    loader: async ({ deps }) => {
        const result = await getGlobalServices({ data: deps });
        if ("unauthorized" in result) throw redirect({ to: "/login" });
        return result;
    },
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: AdminServicesRoute,
});

function AdminServicesRoute() {
    const { servicesData, categoriesData } = Route.useLoaderData();
    return (
        <div className="container mx-auto py-8">
            <ServicesTableClient
                services={Array.isArray(servicesData) ? servicesData : []}
                categories={Array.isArray(categoriesData) ? categoriesData : []}
                isSuperAdmin={true}
            />
        </div>
    );
}
