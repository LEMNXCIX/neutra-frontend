import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";

type Search = { tenantId?: string };

const getGlobalCategories = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const [{ api }, { validateAdminAccess }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/lib/server-auth"),
        ]);
        const { isValid } = await validateAdminAccess();
        if (!isValid) return { unauthorized: true as const };

        const query = new URLSearchParams();
        if (data.tenantId) query.set("tenantId", data.tenantId);
        else query.set("tenantId", "all");

        const result = await api
            .get<any>(`/categories?${query.toString()}`)
            .catch(() => ({}));
        const categories =
            result?.categories || (Array.isArray(result) ? result : []);
        const stats = result?.stats || {
            totalCategories: 0,
            totalProducts: 0,
            averageProductsPerCategory: 0,
        };
        const pagination = result?.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
        };
        return { categories, stats, pagination };
    });

export const Route = createFileRoute("/_admin/admin/categories/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        tenantId:
            typeof search.tenantId === "string" ? search.tenantId : undefined,
    }),
    loaderDeps: ({ search }) => ({ tenantId: search.tenantId }),
    loader: async ({ deps }) => {
        const result = await getGlobalCategories({ data: deps });
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
    component: AdminCategoriesRoute,
});

function AdminCategoriesRoute() {
    const { categories, stats, pagination } = Route.useLoaderData();
    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Categorías globales
            </h2>
            <CategoriesTableClient
                categories={categories}
                stats={stats}
                pagination={pagination}
                isSuperAdmin={true}
            />
        </div>
    );
}
