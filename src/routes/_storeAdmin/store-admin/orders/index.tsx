import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import OrdersTableClient from "@/components/admin/orders/OrdersTableClient";
import { parseOrdersResponse } from "@/lib/orders-page";

type Search = {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
};

const getOrdersData = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const { api } = await import("@/lib/api-client");
        const page =
            typeof data.page === "string" ? parseInt(data.page, 10) : 1;
        const limit =
            typeof data.limit === "string" ? parseInt(data.limit, 10) : 10;
        const search = data.search ?? "";
        const status = data.status ?? "all";

        try {
            const queryParams = new URLSearchParams();
            if (search) queryParams.set("search", search);
            if (status && status !== "all") queryParams.set("status", status);
            queryParams.set("page", page.toString());
            queryParams.set("limit", limit.toString());
            const ordersUrl = `/order?${queryParams.toString()}`;

            const [ordersResult, statsResult, statusesResult] =
                await Promise.all([
                    api
                        .getWithMeta<any>(ordersUrl)
                        .catch(() => ({ data: [], meta: undefined })),
                    api.get<any>("/order/stats").catch(() => ({})),
                    api.get<any[]>("/order/statuses").catch(() => []),
                ]);
            return parseOrdersResponse(
                ordersResult,
                statsResult,
                statusesResult,
                page,
                limit,
            );
        } catch (err) {
            console.error("Error fetching orders:", err);
            return {
                orders: [],
                stats: { totalOrders: 0, totalRevenue: 0, statusCounts: {} },
                statuses: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                },
            };
        }
    });

export const Route = createFileRoute("/_storeAdmin/store-admin/orders/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        page: typeof search.page === "string" ? search.page : undefined,
        limit: typeof search.limit === "string" ? search.limit : undefined,
        search: typeof search.search === "string" ? search.search : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    loaderDeps: ({ search }) => ({
        page: search.page,
        limit: search.limit,
        search: search.search,
        status: search.status,
    }),
    loader: ({ deps }) => getOrdersData({ data: deps }),
    head: () => ({
        meta: [
            { title: "Pedidos" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: StoreAdminOrdersRoute,
});

function StoreAdminOrdersRoute() {
    const { orders, stats, pagination, statuses } = Route.useLoaderData();
    return (
        <OrdersTableClient
            orders={orders}
            stats={stats}
            pagination={pagination}
            initialStatuses={statuses}
        />
    );
}
