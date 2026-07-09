import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";
import { bannersService } from "@/services/banners.service";
import { validateAdminAccess } from "@/lib/server-auth";
import { api } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export default async function SuperAdminBannersPage({
    searchParams,
}: {
    searchParams: Promise<{
        tenantId?: string;
        page?: string;
        search?: string;
        status?: string;
    }>;
}) {
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    const tenantId = params.tenantId === "all" ? undefined : params.tenantId;

    const query = new URLSearchParams();
    if (tenantId) query.append("tenantId", tenantId);

    const banners = (await api.get<any[]>(`/banners?${query.toString()}`).catch(() => [])) || [];

    // Minimal stats for now
    const stats = {
        totalBanners: banners.length,
        activeBanners: banners.filter((b: any) => b.active).length,
        inactiveBanners: banners.filter((b: any) => !b.active).length,
    };

    const pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: banners.length,
        itemsPerPage: 100,
    };

    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={null}>
                <BannersTableClient
                    banners={banners}
                    stats={stats}
                    pagination={pagination}
                    isSuperAdmin={true}
                />
            </Suspense>
        </div>
    );
}
