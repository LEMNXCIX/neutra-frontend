import React from "react";
import fs from "fs";
import path from "path";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";

const COUPONS_PATH = path.join(process.cwd(), "src", "data", "coupons.json");

type Coupon = {
    code: string;
    type: "amount" | "percent";
    value: number;
    used?: boolean;
    expires?: string;
};

async function getCoupons(search: string, type: string, status: string, page: number, limit: number) {
    try {
        const raw = fs.readFileSync(COUPONS_PATH, "utf-8");
        let coupons = JSON.parse(raw) as Coupon[];

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            coupons = coupons.filter((c) => c.code.toLowerCase().includes(query));
        }

        if (type && type !== "all") {
            coupons = coupons.filter((c) => c.type === type);
        }

        if (status && status !== "all") {
            const now = new Date();
            if (status === "used") {
                coupons = coupons.filter((c) => c.used);
            } else if (status === "unused") {
                coupons = coupons.filter((c) => !c.used);
            } else if (status === "expired") {
                coupons = coupons.filter((c) => c.expires && new Date(c.expires) < now);
            } else if (status === "active") {
                coupons = coupons.filter((c) => !c.used && (!c.expires || new Date(c.expires) >= now));
            }
        }

        // Calculate stats
        const totalCoupons = coupons.length;
        const now = new Date();
        const usedCoupons = coupons.filter((c) => c.used).length;
        const expiredCoupons = coupons.filter((c) => c.expires && new Date(c.expires) < now).length;
        const activeCoupons = coupons.filter((c) => !c.used && (!c.expires || new Date(c.expires) >= now)).length;
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
        console.error("Error reading coupons:", err);
        return {
            coupons: [],
            stats: { totalCoupons: 0, usedCoupons: 0, unusedCoupons: 0, expiredCoupons: 0, activeCoupons: 0 },
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
