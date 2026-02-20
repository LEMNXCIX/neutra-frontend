import React from "react";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";
import { extractTokenFromCookies, validateAdminAccess } from "@/lib/server-auth";
import { get as backendGet } from "../../../lib/backend-api";

export const dynamic = 'force-dynamic';

async function getCoupons(search: string, type: string, status: string, page: number, limit: number) {
    try {
        const token = await extractTokenFromCookies();
        if (!token) {
            // Handle case where token is not available, e.g., redirect to login or return empty data
            console.error("Authentication token not found.");
            return {
                coupons: [],
                stats: { totalCoupons: 0, usedCoupons: 0, unusedCoupons: 0, expiredCoupons: 0, activeCoupons: 0 },
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit },
            };
        }

        // Build query string for backend
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (type && type !== 'all') queryParams.set('type', type);
        if (status && status !== 'all') queryParams.set('status', status);
        queryParams.set('page', page.toString());
        queryParams.set('limit', limit.toString());

        const queryString = queryParams.toString();
        const couponsUrl = queryString ? `/coupons?${queryString}` : '/coupons';

        // Fetch coupons and stats in parallel from backend
        const [couponsResult, statsResult] = await Promise.all([
            backendGet(couponsUrl, token).catch(err => ({ success: false, error: err.message, data: [] })),
            backendGet('/coupons/stats', token).catch(err => ({ success: false, error: err.message }))
        ]);

        if (!couponsResult.success) {
            console.error('Failed to fetch coupons from backend:', couponsResult.error);
            return {
                coupons: [],
                stats: { totalCoupons: 0, usedCoupons: 0, unusedCoupons: 0, expiredCoupons: 0, activeCoupons: 0 },
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit },
            };
        }

        const coupons = Array.isArray(couponsResult.data) ? couponsResult.data : [];
        const pagination = (couponsResult as any).pagination || {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit
        };

        const stats = statsResult.success && (statsResult as any).data ? (statsResult as any).data : {
            totalCoupons: coupons.length,
            activeCoupons: 0,
            usedCoupons: 0,
            unusedCoupons: coupons.length,
            expiredCoupons: 0
        };

        return {
            coupons,
            stats,
            pagination: {
                currentPage: pagination.page || page,
                totalPages: pagination.totalPages || 0,
                totalItems: pagination.total || 0,
                itemsPerPage: pagination.limit || limit
            },
        };
    } catch (err) {
        console.error("Error fetching coupons:", err);
        return {
            coupons: [],
            stats: {
                totalCoupons: 0,
                usedCoupons: 0,
                unusedCoupons: 0,
                expiredCoupons: 0,
                activeCoupons: 0,
            },
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

export default async function CouponsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const type = typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : "all";
    const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "all";

    const data = await getCoupons(search, type, status, page, limit);

    return (
        <CouponsTableClient
            coupons={data.coupons}
            stats={data.stats}
            pagination={data.pagination}
        />
    );
}
