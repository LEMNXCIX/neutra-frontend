import React from "react";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";
import { extractTokenFromCookies, validateAdminAccess } from "@/lib/server-auth";
import { get as backendGet } from "../../../lib/backend-api";

export const dynamic = 'force-dynamic';

async function getBanners() {
    try {
        const token = (await extractTokenFromCookies()) || undefined;

        // Check if user is super admin to allow global view
        const adminCheck = await validateAdminAccess();
        const isSuperAdmin = adminCheck.isValid && adminCheck.user?.role?.name === 'SUPER_ADMIN';

        console.log('[BannersPage] Fetching banners from /banners/all/list with token:', !!token);

        // Fetch from backend with automatic tenant context and auth
        const endpoint = isSuperAdmin ? '/banners/all/list?tenantId=all' : '/banners/all/list';
        const result = await backendGet(endpoint, token);

        console.log('[BannersPage] Result success:', result.success);

        if (!result.success) {
            console.error('Failed to fetch banners:', result.error);
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
                error: result.error || 'Unknown error fetching banners',
            };
        }

        const banners = Array.isArray(result.data) ? result.data : [];

        // Calculate stats
        const totalBanners = banners.length;
        const activeBanners = banners.filter((b: { active?: boolean }) => b.active).length;
        const withImages = banners.filter((b: { image?: string }) => b.image).length;

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
                totalPages: 1, // Assuming all items are on one page for now
                totalItems: totalBanners,
                itemsPerPage: totalBanners > 0 ? totalBanners : 10, // Show all if any, else default
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
            error: err.message || 'Exception during banner fetch',
        };
    }
}

export default async function BannersPage() {
    const data = await getBanners();

    return (
        <div className="space-y-4">
            {data.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Fetch Error: </strong>
                    <span className="block sm:inline">{data.error}</span>
                </div>
            )}
            <BannersTableClient
                banners={data.banners}
                stats={data.stats}
                pagination={data.pagination}
            />
        </div>
    );
}
