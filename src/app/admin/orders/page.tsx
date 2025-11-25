import React from "react";
import fs from "fs";
import path from "path";
import OrdersTableClient from "@/components/admin/orders/OrdersTableClient";

const ORDERS_PATH = path.join(process.cwd(), "src", "data", "orders.json");

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
        const raw = fs.readFileSync(ORDERS_PATH, "utf-8");
        let orders = JSON.parse(raw) as Order[];

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            orders = orders.filter(
                (o) =>
                    o.id.toLowerCase().includes(query) ||
                    o.userId.toLowerCase().includes(query)
            );
        }

        if (status && status !== "all") {
            orders = orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
        }

        // Calculate stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const statusCounts: Record<string, number> = {};
        orders.forEach((o) => {
            const s = o.status.toLowerCase();
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
        console.error("Error reading orders:", err);
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
