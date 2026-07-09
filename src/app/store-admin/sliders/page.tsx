import React, { Suspense } from "react";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";
import { api } from '@/lib/api-client';
import { validateAdminAccess } from "@/lib/server-auth";

export const metadata = { title: "Sliders" };

export const dynamic = "force-dynamic";

async function getSliders(
    search: string,
    status: string,
    page: number,
    limit: number,
) {
    try {
        const adminCheck = await validateAdminAccess();
        const isSuperAdmin =
            adminCheck.isValid && adminCheck.user?.role?.name === "SUPER_ADMIN";

        const endpoint = isSuperAdmin ? "/slide?tenantId=all" : "/slide";
        const result = await api.get<any[]>(endpoint);

        let sliders = Array.isArray(result) ? result : [];

        type Slider = {
            title?: string;
            subtitle?: string;
            active?: boolean;
            img?: string;
        };

        if (search) {
            const query = search.toLowerCase();
            sliders = sliders.filter(
                (s: Slider) =>
                    s.title?.toLowerCase().includes(query) ||
                    s.subtitle?.toLowerCase().includes(query),
            );
        }

        if (status && status !== "all") {
            if (status === "active") {
                sliders = sliders.filter((s: Slider) => s.active);
            } else if (status === "inactive") {
                sliders = sliders.filter((s: Slider) => !s.active);
            }
        }

        const totalSliders = sliders.length;
        const activeSliders = sliders.filter((s: Slider) => s.active).length;
        const withImages = sliders.filter((s: Slider) => s.img).length;

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
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        status?: string;
    }>;
};

export default async function SlidersPage({ searchParams }: Props) {
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

    const data = await getSliders(search, status, page, limit);

    return (
        <Suspense fallback={null}>
            <SlidersTableClient
                sliders={data.sliders}
                stats={data.stats}
                pagination={data.pagination}
            />
        </Suspense>
    );
}
