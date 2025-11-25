import React from "react";
import fs from "fs";
import path from "path";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";

const BANNERS_PATH = path.join(process.cwd(), "src", "data", "banners.json");

type Banner = {
    id: string;
    title: string;
    subtitle?: string;
    cta?: string;
    ctaUrl?: string;
    startsAt?: string;
    endsAt?: string;
    active?: boolean;
};

async function getBanners(search: string, status: string, page: number, limit: number) {
    try {
        const raw = fs.readFileSync(BANNERS_PATH, "utf-8");
        let banners = JSON.parse(raw) as Banner[];

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            banners = banners.filter(
                (b) =>
                    b.title.toLowerCase().includes(query) ||
                    b.id.toLowerCase().includes(query) ||
                    (b.subtitle && b.subtitle.toLowerCase().includes(query))
            );
        }

        if (status && status !== "all") {
            const isActive = status === "active";
            banners = banners.filter((b) => (b.active ?? true) === isActive);
        }

        // Calculate stats
        const totalBanners = banners.length;
        const activeBanners = banners.filter((b) => b.active ?? true).length;
        const inactiveBanners = totalBanners - activeBanners;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedBanners = banners.slice(startIndex, endIndex);
        const totalPages = Math.ceil(totalBanners / limit);

        return {
            banners: paginatedBanners,
            stats: {
                totalBanners,
                activeBanners,
                inactiveBanners,
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalBanners,
                itemsPerPage: limit,
            },
        };
    } catch (err) {
        console.error("Error reading banners:", err);
        return {
            banners: [],
            stats: { totalBanners: 0, activeBanners: 0, inactiveBanners: 0 },
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

export default async function BannersPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "all";

    const data = await getBanners(search, status, page, limit);

    return (
        <BannersTableClient
            banners={data.banners}
            stats={data.stats}
            pagination={data.pagination}
        />
    );
}
