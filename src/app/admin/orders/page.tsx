import React from "react";
import { cookies } from 'next/headers';
import OrdersTableClient from "@/components/admin/orders/OrdersTableClient";
import { extractTokenFromCookies, getCookieString } from "@/lib/server-auth";
import { getBackendUrl } from "@/lib/backend-api";

async function getOrders(search: string, status: string, page: number, limit: number) {
    try {
        const token = await extractTokenFromCookies();
        const cookieString = await getCookieString();

        // Fetch from backend with cookies
        const response = await fetch(`${getBackendUrl()}/orders`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch orders:', response.status);
            return {
                orders: [],
                stats: { totalOrders: 0, totalRevenue: 0, statusCounts: {} },
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

        const statusCounts = orders.reduce((acc: Record<string, number>, o: any) => {
            const s = o.status?.toLowerCase() || 'unknown';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

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
                statusCounts,
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
            stats: { totalOrders: 0, totalRevenue: 0, statusCounts: {} },
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
