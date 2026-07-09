import React, { Suspense } from "react";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";
import { validateAdminAccess } from "@/lib/server-auth";
import { api } from '@/lib/api-client';

export const metadata = { title: "Banners" };

export const dynamic = "force-dynamic";

async function getBanners() {
    try {
        const adminCheck = await validateAdminAccess();
        const isSuperAdmin =
            adminCheck.isValid && adminCheck.user?.role?.name === "SUPER_ADMIN";

        const endpoint = isSuperAdmin
            ? "/banners/all/list?tenantId=all"
            : "/banners/all/list";
        const result = await api.get<any[]>(endpoint);

        const banners = Array.isArray(result) ? result : [];

        const totalBanners = banners.length;
        const activeBanners = banners.filter(
            (b: { active?: boolean }) => b.active,
        ).length;
        const withImages = banners.filter(
            (b: { image?: string }) => b.image,
        ).length;

        return {
            banners,
            stats: {
                totalBanners,
                activeBanners,
                inactiveBanners: totalBanners - activeBanners,
                withImages,
            },
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: totalBanners,
                itemsPerPage: totalBanners > 0 ? totalBanners : 10,
            },
            error: undefined,
        };
    } catch (err: any) {
        console.error("Error fetching banners:", err);
        return {
            banners: [],
            stats: {
                totalBanners: 0,
                activeBanners: 0,
                inactiveBanners: 0,
                withImages: 0,
            },
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: 10,
            },
            error: err.message || "Exception during banner fetch",
        };
    }
}

export default async function BannersPage() {
    const data = await getBanners();

    return (
        <div className="space-y-4">
            {data.error && (
                <div
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                    role="alert"
                >
                    <strong className="font-bold">Fetch Error: </strong>
                    <span className="block sm:inline">{data.error}</span>
                </div>
            )}
            <Suspense fallback={null}>
                <BannersTableClient
                    banners={data.banners}
                    stats={data.stats}
                    pagination={data.pagination}
                />
            </Suspense>
        </div>
    );
}
