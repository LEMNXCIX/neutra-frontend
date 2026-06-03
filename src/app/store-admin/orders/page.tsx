import React, { Suspense } from "react";
import OrdersTableClient from "@/components/admin/orders/OrdersTableClient";
import {
    extractTokenFromCookies,
    validateAdminAccess,
} from "@/lib/server-auth";
import { get as backendGet } from "../../../lib/backend-api";

export const metadata = { title: "Orders" };

export const dynamic = "force-dynamic";

async function getOrders(
    search: string,
    status: string,
    page: number,
    limit: number,
) {
    try {
        const token = (await extractTokenFromCookies()) || undefined;

        // Build query string for backend
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (status && status !== "all") queryParams.set("status", status);
        queryParams.set("page", page.toString());
        queryParams.set("limit", limit.toString());

        const queryString = queryParams.toString();
        const ordersUrl = queryString ? `/order?${queryString}` : "/order";

        // Fetch orders and stats in parallel from backend
        const [ordersResult, statsResult, statusesResult] = await Promise.all([
            backendGet(ordersUrl, token).catch((err) => ({
                success: false,
                error: err.message,
                data: [],
            })),
            backendGet("/order/stats", token).catch((err) => ({
                success: false,
                error: err.message,
            })),
            backendGet("/order/statuses", token).catch((err) => ({
                success: false,
                error: err.message,
            })),
        ]);

        if (!ordersResult.success) {
            console.error(
                "Failed to fetch orders from backend:",
                ordersResult.error,
            );
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

        const orders = Array.isArray(ordersResult.data)
            ? ordersResult.data
            : [];
        const pagination = (ordersResult as any).pagination || {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
        };

        const stats =
            statsResult.success && (statsResult as any).data
                ? (statsResult as any).data
                : {
                      totalOrders: orders.length,
                      totalRevenue: 0,
                      statusCounts: {},
                  };

        const statuses =
            statusesResult.success &&
            Array.isArray((statusesResult as any).data)
                ? (statusesResult as any).data
                : [];

        return {
            orders,
            stats,
            statuses,
            pagination: {
                currentPage: pagination.page || page,
                totalPages: pagination.totalPages || 0,
                totalItems: pagination.total || 0,
                itemsPerPage: pagination.limit || limit,
            },
        };
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
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
