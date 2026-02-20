import React from "react";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";
import { get as backendGet } from "../../../lib/backend-api";
import { extractTokenFromCookies, validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

async function getSliders(search: string, status: string, page: number, limit: number) {
    try {
        const token = (await extractTokenFromCookies()) || undefined;

        // Check if user is super admin to allow global view
        const adminCheck = await validateAdminAccess();
        const isSuperAdmin = adminCheck.isValid && adminCheck.user?.role?.name === 'SUPER_ADMIN';

        // Fetch from backend
        const endpoint = isSuperAdmin ? '/slide?tenantId=all' : '/slide';
        const result = await backendGet(endpoint, token);

        if (!result.success) {
            console.error('Failed to fetch sliders:', result.error);
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

        let sliders = Array.isArray(result.data) ? result.data : [];

        type Slider = {
            title?: string;
            subtitle?: string;
            active?: boolean;
            img?: string;
        };

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            sliders = sliders.filter((s: Slider) =>
                s.title?.toLowerCase().includes(query) ||
                s.subtitle?.toLowerCase().includes(query)
            );
        }

        if (status && status !== "all") {
            if (status === "active") {
                sliders = sliders.filter((s: Slider) => s.active);
            } else if (status === "inactive") {
                sliders = sliders.filter((s: Slider) => !s.active);
            }
        }

        // Calculate stats
        const totalSliders = sliders.length;
        const activeSliders = sliders.filter((s: Slider) => s.active).length;
        const withImages = sliders.filter((s: Slider) => s.img).length;

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
