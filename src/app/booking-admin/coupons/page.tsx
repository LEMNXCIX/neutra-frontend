import { Suspense } from "react";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";
import { api } from '@/lib/api-client';

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Coupons Management | Booking Admin",
    description: "Manage discount coupons for appointments",
};

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
        const url = `/coupons${queryString ? `?${queryString}` : ""}`;

        const data = await api.get<any>(url);

        return {
            coupons: data?.data || [],
            stats: data?.stats || {
                totalCoupons: 0,
                usedCoupons: 0,
                unusedCoupons: 0,
                expiredCoupons: 0,
                activeCoupons: 0,
                activeDiscounts: 0,
            },
            pagination: data?.pagination
                ? {
                      currentPage: data.pagination.page,
                      totalPages: data.pagination.totalPages,
                      totalItems: data.pagination.total,
                      itemsPerPage: data.pagination.limit,
                  }
                : {
                      currentPage: page,
                      totalPages: 0,
                      totalItems: 0,
                      itemsPerPage: limit,
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
            </div>
            <Suspense fallback={null}>
                <CouponsTableClient
                    coupons={data.coupons}
                    stats={data.stats}
                    pagination={data.pagination}
                />
            </Suspense>
        </div>
    );
}
