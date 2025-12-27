
import React from 'react';
import { redirect } from "next/navigation";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";
import { bannersService } from "@/services/banners.service";
import { validateAdminAccess } from "@/lib/server-auth";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default async function SuperAdminBannersPage({
    searchParams,
}: {
    searchParams: { tenantId?: string; page?: string; search?: string; status?: string };
}) {
    const { isValid, cookieHeader } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    const tenantId = params.tenantId === 'all' ? undefined : params.tenantId;

    const query = new URLSearchParams();
    if (tenantId) query.append('tenantId', tenantId);

    // Fetch data server-side
    const response = await fetch(`${BACKEND_API_URL}/banners?${query.toString()}`, {
        headers: { 'Cookie': cookieHeader! },
        cache: 'no-store'
    });
    const result = await response.json();
    const banners = result.data || [];

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
            <BannersTableClient
                banners={banners}
                stats={stats}
                pagination={pagination}
                isSuperAdmin={true}
            />
        </div>
    );
}
