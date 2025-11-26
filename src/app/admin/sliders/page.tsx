import React from "react";
import { slidersService } from "@/services";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";

async function getSliders(search: string, status: string, page: number, limit: number) {
    try {
        // Use slidersService which uses apiClient
        const allSliders = await slidersService.getAll();

        let sliders = allSliders;

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            sliders = sliders.filter((s: any) =>
                s.title.toLowerCase().includes(query) ||
                (s.subtitle && s.subtitle.toLowerCase().includes(query))
            );
        }

        if (status && status !== "all") {
            if (status === "active") {
                sliders = sliders.filter((s: any) => s.active);
            } else if (status === "inactive") {
                sliders = sliders.filter((s: any) => !s.active);
            }
        }

        // Calculate stats
        const totalSliders = sliders.length;
        const activeSliders = sliders.filter((s: any) => s.active).length;
        const withImages = sliders.filter((s: any) => s.image).length;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSliders = sliders.slice(startIndex, endIndex);
        const totalPages = Math.ceil(totalSliders / limit);

        return {
            sliders: paginatedSliders,
            stats: {
                totalSliders,
                activeSliders,
                inactiveSliders: totalSliders - activeSliders,
                withImages,
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalSliders,
                itemsPerPage: limit,
            },
        };
    } catch (err) {
        console.error("Error fetching sliders:", err);
        return {
            sliders: [],
            stats: {
                totalSliders: 0,
                activeSliders: 0,
                inactiveSliders: 0,
                withImages: 0,
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

export default async function SlidersPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "all";

    const data = await getSliders(search, status, page, limit);

    return (
        <SlidersTableClient
            sliders={data.sliders}
            stats={data.stats}
            pagination={data.pagination}
        />
    );
}
