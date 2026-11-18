import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import ProductsTableClient from "@/components/admin/products/ProductsTableClient";

type Search = { tenantId?: string };

const getGlobalProducts = createServerFn({ method: "GET" })
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

        const [productsData, categoriesData] = await Promise.all([
            api.get<any>(`/products?${query.toString()}`).catch(() => ({})),
            api.get<any>(`/categories?tenantId=all`).catch(() => ({})),
        ]);
        return { productsData, categoriesData };
    });

export const Route = createFileRoute("/_admin/admin/products/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        tenantId:
            typeof search.tenantId === "string" ? search.tenantId : undefined,
    }),
    loaderDeps: ({ search }) => ({ tenantId: search.tenantId }),
    loader: async ({ deps }) => {
        const result = await getGlobalProducts({ data: deps });
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
    component: AdminProductsRoute,
});

function AdminProductsRoute() {
    const { productsData, categoriesData } = Route.useLoaderData();
    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Productos globales
            </h2>
            <ProductsTableClient
                products={
                    productsData?.products ||
                    (Array.isArray(productsData) ? productsData : [])
                }
                stats={
                    productsData?.stats || {
                        totalProducts: 0,
                        totalValue: 0,
                        lowStockCount: 0,
                    }
                }
                pagination={
                    productsData?.pagination || {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: 0,
                        itemsPerPage: 10,
                    }
                }
                categories={
                    categoriesData?.categories ||
                    (Array.isArray(categoriesData) ? categoriesData : [])
                }
                isSuperAdmin={true}
            />
        </div>
    );
}
