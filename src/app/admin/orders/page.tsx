import React from "react";
import OrdersTableClient from "@/components/admin/orders/OrdersTableClient";
import { ordersService } from "@/services";

type OrderItem = { id: string; name: string; qty: number; price: number };
type Order = {
    id: string;
    userId: string;
    total: number;
    status: string;
    tracking: string;
    address: string;
    items: OrderItem[];
    date: string;
    coupon?: {
        code: string;
        type: string;
        value: number;
        discount: number;
    };
};

async function getOrders(search: string, status: string) {
    try {
        // Use ordersService to get all orders from backend
        const allOrders = await ordersService.getAll();

        // Apply filters client-side (ideally backend should support these)
        let orders = allOrders as any[];

        if (search) {
            const query = search.toLowerCase();
            orders = orders.filter(
                (o: any) =>
                    o.id.toLowerCase().includes(query) ||
                    (o.userId && o.userId.toLowerCase().includes(query))
            );
        }

        if (status && status !== "all") {
            orders = orders.filter((o: any) =>
                o.status && o.status.toLowerCase() === status.toLowerCase()
            );
        }

        // Calculate stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        const statusCounts: Record<string, number> = {};
        orders.forEach((o: any) => {
            const s = (o.status || '').toLowerCase();
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        return {
            orders,
            stats: {
                totalOrders,
                totalRevenue,
                statusCounts,
            },
        };
    } catch (err) {
        console.error("Error fetching orders:", err);
        return {
            orders: [],
            stats: { totalOrders: 0, totalRevenue: 0, statusCounts: {} },
        };
    }
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrdersPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "all";

    const data = await getOrders(search, status);

    return (
        <OrdersTableClient
            orders={data.orders}
            stats={data.stats}
        />
    );
}
