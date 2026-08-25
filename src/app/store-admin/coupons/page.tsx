import React, { Suspense } from "react";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";
import { api } from '@/lib/api-client';

export const metadata = { title: "Cupones" };

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

async function getCoupons(
    search: string,
    type: string,
    status: string,
    page: number,
    limit: number,
) {
    // Coupons are a small config list: fetch complete (no page/limit) and
    // paginate client-side — the backend's paginated branch drops `total`.
    try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (type && type !== "all") queryParams.set("type", type);
        if (status && status !== "all") queryParams.set("status", status);

        const queryString = queryParams.toString();
        const couponsUrl = queryString ? `/coupons?${queryString}` : "/coupons";

        const [couponsResult, statsResult] = await Promise.all([
            api.get<any>(couponsUrl).catch(() => []),
            api.get<any>("/coupons/stats").catch(() => null),
        ]);

        const allCoupons = Array.isArray(couponsResult) ? couponsResult : [];
        const coupons = allCoupons.slice((page - 1) * PER_PAGE, page * PER_PAGE);
        const now = new Date();

        const stats = statsResult || {
            totalCoupons: allCoupons.length,
            activeCoupons: allCoupons.filter((c) => c.active).length,
            usedCoupons: allCoupons.filter((c) => c.usageCount > 0).length,
            unusedCoupons: allCoupons.filter((c) => !c.usageCount).length,
            expiredCoupons: allCoupons.filter(
                (c) => c.expiresAt && new Date(c.expiresAt) < now,
            ).length,
        };

        return {
            coupons,
            stats,
            pagination: {
                currentPage: page,
                totalPages: Math.max(1, Math.ceil(allCoupons.length / PER_PAGE)),
                totalItems: allCoupons.length,
                itemsPerPage: PER_PAGE,
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
