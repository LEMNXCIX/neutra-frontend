import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";

type Search = { type?: string };

const getCategoriesData = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const { api } = await import("@/lib/api-client");
        try {
            const query = new URLSearchParams();
            if (data.type) query.set("type", data.type);
            const endpoint = query.toString()
                ? `/categories?${query.toString()}`
                : "/categories";
            const payload = await api.get<any>(endpoint);
            const categories =
                payload?.categories || (Array.isArray(payload) ? payload : []);
            const backendStats = payload?.stats;
            const totalCategories = categories.length;
            const activeCategories = categories.filter(
                (c: any) => c.active,
            ).length;
            const withImages = categories.filter(
                (c: any) => c.image || c.img,
            ).length;
            const totalProducts =
                backendStats?.totalProducts ??
                categories.reduce(
                    (sum: number, c: any) =>
                        sum + (c.productCount || c._count?.products || 0),
                    0,
                );
            const averageProductsPerCategory =
                backendStats?.avgProductsPerCategory ??
                (totalCategories > 0
                    ? Math.round(totalProducts / totalCategories)
                    : 0);
            const withProducts = categories.filter(
                (c: any) => (c.productCount || c._count?.products || 0) > 0,
            ).length;
            const pagination = payload?.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalItems: totalCategories,
                itemsPerPage: totalCategories > 0 ? totalCategories : 10,
            };
            return {
                categories,
                stats: {
                    totalCategories,
                    activeCategories,
                    inactiveCategories: totalCategories - activeCategories,
                    withImages,
                    totalProducts,
                    averageProductsPerCategory,
                    withProducts,
                },
                pagination,
            };
        } catch (err) {
            console.error("Error fetching categories:", err);
            return {
                categories: [],
                stats: {
                    totalCategories: 0,
                    activeCategories: 0,
                    inactiveCategories: 0,
                    withImages: 0,
                    totalProducts: 0,
                    averageProductsPerCategory: 0,
                    withProducts: 0,
                },
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: 10,
                },
            };
        }
    });

export const Route = createFileRoute("/_storeAdmin/store-admin/categories/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        type: typeof search.type === "string" ? search.type : undefined,
    }),
    loaderDeps: ({ search }) => ({ type: search.type }),
    loader: ({ deps }) => getCategoriesData({ data: deps }),
    head: () => ({
        meta: [
            { title: "Categorías" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: StoreAdminCategoriesRoute,
});

function StoreAdminCategoriesRoute() {
    const { categories } = Route.useLoaderData();
    return (
        <CategoriesTableClient
            categories={categories}
            stats={Route.useLoaderData().stats}
            pagination={{
                currentPage: 1,
                totalPages: 1,
                totalItems: categories.length,
                itemsPerPage: categories.length,
            }}
        />
    );
}
