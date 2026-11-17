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
            query.set("type", data.type || "SERVICE");
            const payload = await api.get<any>(
                `/categories?${query.toString()}`,
            );
            const categories =
                payload?.categories || (Array.isArray(payload) ? payload : []);
            const backendStats = payload?.data?.stats || payload?.stats;
            const stats = backendStats || {
                totalCategories: categories.length,
                totalProducts: categories.reduce(
                    (sum: number, c: any) =>
                        sum + (c.productCount || c._count?.products || 0),
                    0,
                ),
                averageProductsPerCategory:
                    categories.length > 0
                        ? Math.round(
                              categories.reduce(
                                  (sum: number, c: any) =>
                                      sum +
                                      (c.productCount ||
                                          c._count?.products ||
                                          0),
                                  0,
                              ) / categories.length,
                          )
                        : 0,
            };
            return { categories, stats };
        } catch (err) {
            console.error("Error fetching categories:", err);
            return {
                categories: [],
                stats: {
                    totalCategories: 0,
                    totalProducts: 0,
                    averageProductsPerCategory: 0,
                },
            };
        }
    });

export const Route = createFileRoute(
    "/_bookingAdmin/booking-admin/categories/",
)({
    validateSearch: (search: Record<string, unknown>): Search => ({
        type: typeof search.type === "string" ? search.type : undefined,
    }),
    loaderDeps: ({ search }) => ({ type: search.type }),
    loader: ({ deps }) => getCategoriesData({ data: deps }),
    head: () => ({
        meta: [
            { title: "Categorías de reservas" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: BookingAdminCategoriesRoute,
});

function BookingAdminCategoriesRoute() {
    const { categories, stats } = Route.useLoaderData();
    return (
        <div className="p-6">
            <CategoriesTableClient
                categories={categories}
                stats={stats}
                pagination={{
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: categories.length,
                    itemsPerPage: categories.length,
                }}
            />
        </div>
    );
}
