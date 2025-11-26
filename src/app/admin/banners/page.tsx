import React from "react";
import { cookies } from 'next/headers';
import BannersTableClient from "@/components/admin/banners/BannersTableClient";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getBanners() {
    try {
        // Get cookies from request
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch from backend with cookies
        const response = await fetch(`${BACKEND_API_URL}/banners`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch banners:', response.status);
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

        const data = await response.json();
        const banners = data.success && data.data ? data.data : [];

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
