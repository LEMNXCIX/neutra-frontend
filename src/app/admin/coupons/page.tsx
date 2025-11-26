import React from "react";
import { cookies } from 'next/headers';
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getCoupons(search: string, type: string, status: string, page: number, limit: number) {
    try {
        // Get cookies from request
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch from backend with cookies
        const response = await fetch(`${BACKEND_API_URL}/coupons`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch coupons:', response.status);
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

        const data = await response.json();
        let coupons = data.success && data.data ? data.data : [];

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            coupons = coupons.filter((c: any) => c.code?.toLowerCase().includes(query));
        }

        if (type && type !== "all") {
            coupons = coupons.filter((c: any) => c.type === type);
        }

        if (status && status !== "all") {
            const now = new Date();
            if (status === "used") {
                coupons = coupons.filter((c: any) => c.used);
            } else if (status === "unused") {
                coupons = coupons.filter((c: any) => !c.used);
            } else if (status === "expired") {
                coupons = coupons.filter((c: any) => c.expires && new Date(c.expires) < now);
            } else if (status === "active") {
                coupons = coupons.filter((c: any) => !c.used && (!c.expires || new Date(c.expires) >= now));
            }
        }

        // Calculate stats
        const totalCoupons = coupons.length;
        const now = new Date();
        const usedCoupons = coupons.filter((c: any) => c.used).length;
        const expiredCoupons = coupons.filter((c: any) => c.expires && new Date(c.expires) < now).length;
        const activeCoupons = coupons.filter((c: any) => !c.used && (!c.expires || new Date(c.expires) >= now)).length;
        const unusedCoupons = totalCoupons - usedCoupons;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCoupons = coupons.slice(startIndex, endIndex);
        const totalPages = Math.ceil(totalCoupons / limit);

        return {
            coupons: paginatedCoupons,
            stats: {
                totalCoupons,
                usedCoupons,
                unusedCoupons,
                expiredCoupons,
                activeCoupons,
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCoupons,
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
