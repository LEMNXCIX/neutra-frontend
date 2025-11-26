import React from "react";
import { cookies } from 'next/headers';
import OrdersTableClient from "@/components/admin/orders/OrdersTableClient";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getOrders(search: string, status: string, page: number, limit: number) {
    try {
        // Get cookies from request
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch from backend with cookies
        const response = await fetch(`${BACKEND_API_URL}/order`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch orders:', response.status);
            return {
                orders: [],
                stats: { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 },
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit },
            };
        }

        const data = await response.json();
        let orders = data.success && data.data ? (Array.isArray(data.data) ? data.data : []) : [];

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            orders = orders.filter((o: any) =>
                o.id?.toLowerCase().includes(query) ||
                o.user?.name?.toLowerCase().includes(query) ||
                o.user?.email?.toLowerCase().includes(query)
            );
        }

        if (status && status !== "all") {
            orders = orders.filter((o: any) => o.status === status);
        }

        // Calculate stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
        const completedOrders = orders.filter((o: any) => o.status === 'completed').length;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedOrders = orders.slice(startIndex, endIndex);
        const totalPages = Math.ceil(totalOrders / limit);

        return {
            orders: paginatedOrders,
            stats: {
                totalOrders,
                totalRevenue,
                pendingOrders,
                completedOrders,
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalOrders,
                itemsPerPage: limit,
            },
        };
    } catch (err) {
        console.error("Error fetching orders:", err);
        return {
            orders: [],
            stats: { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 },
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
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrdersPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "all";

    const data = await getOrders(search, status, page, limit);

    return (
        <OrdersTableClient
            orders={data.orders}
            stats={data.stats}
            pagination={data.pagination}
        />
    );
}
