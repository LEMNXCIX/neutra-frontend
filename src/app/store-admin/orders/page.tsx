import React, { Suspense } from "react";
import OrdersTableClient from "@/components/admin/orders/OrdersTableClient";
import { api } from '@/lib/api-client';
import { parseOrdersResponse } from '@/lib/orders-page';

export const metadata = { title: "Pedidos" };

export const dynamic = "force-dynamic";

async function getOrders(
    search: string,
    status: string,
    page: number,
    limit: number,
) {
    try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (status && status !== "all") queryParams.set("status", status);
        queryParams.set("page", page.toString());
        queryParams.set("limit", limit.toString());

        const queryString = queryParams.toString();
        const ordersUrl = queryString ? `/order?${queryString}` : "/order";

        const [ordersResult, statsResult, statusesResult] = await Promise.all([
            // getWithMeta keeps meta.pagination (backend orders endpoint is
            // the only one that returns real pagination metadata).
            api.getWithMeta<any>(ordersUrl).catch(() => ({ data: [], meta: undefined })),
            api.get<any>("/order/stats").catch(() => ({})),
            api.get<any[]>("/order/statuses").catch(() => []),
        ]);

        return parseOrdersResponse(ordersResult, statsResult, statusesResult, page, limit);
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
}

type Props = {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        status?: string;
    }>;
};

export default async function OrdersPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page =
        typeof resolvedSearchParams.page === "string"
            ? parseInt(resolvedSearchParams.page)
            : 1;
    const limit =
        typeof resolvedSearchParams.limit === "string"
            ? parseInt(resolvedSearchParams.limit)
            : 10;
    const search =
        typeof resolvedSearchParams.search === "string"
            ? resolvedSearchParams.search
            : "";
    const status =
        typeof resolvedSearchParams.status === "string"
            ? resolvedSearchParams.status
            : "all";

    const data = await getOrders(search, status, page, limit);

    return (
        <Suspense fallback={null}>
            <OrdersTableClient
                orders={data.orders}
                stats={data.stats}
                pagination={data.pagination}
                initialStatuses={data.statuses}
            />
        </Suspense>
    );
}
