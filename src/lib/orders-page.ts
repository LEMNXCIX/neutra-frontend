import type { Order } from "@/types/order.types";

export interface OrdersPageData {
    orders: Order[];
    stats: {
        totalOrders: number;
        totalRevenue: number;
        statusCounts: Record<string, number>;
    };
    statuses: Array<{ value: string; label: string }>;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}

/**
 * Maps the raw /order responses (list + stats + statuses) into the shape
 * the orders admin table expects. Pure: trivially testable.
 */
export function parseOrdersResponse(
    ordersResult: unknown,
    statsResult: unknown,
    statusesResult: unknown,
    page: number,
    limit: number,
): OrdersPageData {
    const orders: Order[] = Array.isArray(
        (ordersResult as { data?: Order[] })?.data,
    )
        ? (ordersResult as { data: Order[] }).data
        : [];

    const paginationMeta = (ordersResult as {
        meta?: { pagination?: Record<string, number> };
    })?.meta?.pagination;

    const pagination = paginationMeta || {
        page: 0,
        totalPages: 0,
        total: 0,
        limit: 0,
    };

    const stats = (statsResult as OrdersPageData["stats"]) ?? {
        totalOrders: orders.length,
        totalRevenue: 0,
        statusCounts: {},
    };

    const statuses = Array.isArray(statusesResult) ? statusesResult : [];

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
}
