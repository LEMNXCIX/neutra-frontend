import React from "react";
import { bannersService } from "@/services";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";

async function getBanners() {
    try {
        // Use bannersService which uses apiClient
        const banners = await bannersService.getAll();

        // Calculate stats
        const totalBanners = banners.length;
        const activeBanners = banners.filter((b: any) => b.active).length;
        const withImages = banners.filter((b: any) => b.image).length;

        return {
            banners,
            stats: {
                totalBanners,
                activeBanners,
                inactiveBanners: totalBanners - activeBanners,
                withImages,
            },
        };
    } catch (err) {
        console.error("Error fetching banners:", err);
        return {
            banners: [],
            stats: {
                totalBanners: 0,
                activeBanners: 0,
                inactiveBanners: 0,
                withImages: 0,
            },
        };
    }
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BannersPage({ searchParams }: Props) {
    const data = await getBanners();

    return (
        <BannersTableClient
            banners={data.banners}
            stats={data.stats}
            pagination={{
                currentPage: 1,
                totalPages: 1,
                totalItems: data.banners.length,
                itemsPerPage: data.banners.length,
            }}
        />
    );
}
