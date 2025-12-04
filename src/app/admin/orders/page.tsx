import React from "react";
import { cookies } from 'next/headers';
import OrdersTableClient from "@/components/admin/orders/OrdersTableClient";

async function getOrders(search: string, status: string, page: number, limit: number) {
    try {
        // Build query string
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (status && status !== 'all') queryParams.set('status', status);
        queryParams.set('page', page.toString());
        queryParams.set('limit', limit.toString());

        const queryString = queryParams.toString();

        // Server Components need absolute URLs for fetch
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/admin/orders${queryString ? `?${queryString}` : ''}`;

        // Get cookies to pass to BFF route
        const cookieStore = await cookies();
        const cookieHeader = cookieStore.toString();

        // Fetch from BFF route with cookies
        const response = await fetch(url, {
            cache: 'no-store',
            headers: {
                'Cookie': cookieHeader
            }
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

        return {
            orders: data.data || [],
            stats: data.stats || { totalOrders: 0, totalRevenue: 0, statusCounts: {} },
            pagination: data.pagination ? {
                currentPage: data.pagination.page,
                totalPages: data.pagination.totalPages,
                totalItems: data.pagination.total,
                itemsPerPage: data.pagination.limit
            } : {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit
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
