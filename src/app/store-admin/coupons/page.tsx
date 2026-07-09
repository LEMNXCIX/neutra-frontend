import React, { Suspense } from "react";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";
import { validateAdminAccess } from "@/lib/server-auth";
import { api } from '@/lib/api-client';

export const metadata = { title: "Coupons" };

export const dynamic = "force-dynamic";

async function getCoupons(
    search: string,
    type: string,
    status: string,
    page: number,
    limit: number,
) {
    try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (type && type !== "all") queryParams.set("type", type);
        if (status && status !== "all") queryParams.set("status", status);
        queryParams.set("page", page.toString());
        queryParams.set("limit", limit.toString());

        const queryString = queryParams.toString();
        const couponsUrl = queryString ? `/coupons?${queryString}` : "/coupons";

        const [couponsResult, statsResult] = await Promise.all([
            api.get<any>(couponsUrl).catch(() => ({})),
            api.get<any>("/coupons/stats").catch(() => ({})),
        ]);

        const coupons = Array.isArray(couponsResult)
            ? couponsResult
            : [];
        const pagination = couponsResult?.pagination || {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
        };

        const stats =
            statsResult
                ? statsResult
                : {
                      totalCoupons: coupons.length,
                      activeCoupons: 0,
                      usedCoupons: 0,
                      unusedCoupons: coupons.length,
                      expiredCoupons: 0,
                  };

        return {
            coupons,
            stats,
            pagination: {
                currentPage: pagination.page || page,
                totalPages: pagination.totalPages || 0,
                totalItems: pagination.total || 0,
                itemsPerPage: pagination.limit || limit,
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
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        type?: string;
        status?: string;
    }>;
};

export default async function CouponsPage({ searchParams }: Props) {
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
    const type =
        typeof resolvedSearchParams.type === "string"
            ? resolvedSearchParams.type
            : "all";
    const status =
        typeof resolvedSearchParams.status === "string"
            ? resolvedSearchParams.status
            : "all";

    const data = await getCoupons(search, type, status, page, limit);

    return (
        <Suspense fallback={null}>
            <CouponsTableClient
                coupons={data.coupons}
                stats={data.stats}
                pagination={data.pagination}
            />
        </Suspense>
    );
}
