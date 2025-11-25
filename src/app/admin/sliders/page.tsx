import React from "react";
import fs from "fs";
import path from "path";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";

const SLIDERS_PATH = path.join(process.cwd(), "src", "data", "sliders.json");

type Slide = {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    startsAt?: string;
    endsAt?: string;
    active?: boolean;
};

async function getSliders(search: string, status: string, page: number, limit: number) {
    try {
        const raw = fs.readFileSync(SLIDERS_PATH, "utf-8");
        let sliders = JSON.parse(raw) as Slide[];

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            sliders = sliders.filter(
                (s) =>
                    s.title.toLowerCase().includes(query) ||
                    s.id.toLowerCase().includes(query) ||
                    (s.subtitle && s.subtitle.toLowerCase().includes(query))
            );
        }

        if (status && status !== "all") {
            const isActive = status === "active";
            sliders = sliders.filter((s) => (s.active ?? true) === isActive);
        }

        // Calculate stats
        const totalSliders = sliders.length;
        const activeSliders = sliders.filter((s) => s.active ?? true).length;
        const inactiveSliders = totalSliders - activeSliders;
        const withImages = sliders.filter((s) => s.image).length;

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
                inactiveSliders,
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
        console.error("Error reading sliders:", err);
        return {
            sliders: [],
            stats: { totalSliders: 0, activeSliders: 0, inactiveSliders: 0, withImages: 0 },
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
