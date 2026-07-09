import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";
import { couponsService } from "@/services/coupons.service";
import { validateAdminAccess } from "@/lib/server-auth";
import { api } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export default async function SuperAdminCouponsPage({
    searchParams,
}: {
    searchParams: Promise<{ tenantId?: string }>;
}) {
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    const tenantId = params.tenantId === "all" ? undefined : params.tenantId;

    const query = new URLSearchParams();
    if (tenantId) query.append("tenantId", tenantId);

    const coupons = (await api.get<any[]>(`/coupons?${query.toString()}`).catch(() => [])) || [];

    // Filter logic if needed or just provide initial stats
    const stats = {
        totalCoupons: coupons.length,
        usedCoupons: coupons.filter((c: any) => c.usageCount > 0).length,
        unusedCoupons: coupons.filter((c: any) => c.usageCount === 0).length,
        expiredCoupons: coupons.filter(
            (c: any) => c.expiresAt && new Date(c.expiresAt) < new Date(),
        ).length,
        activeCoupons: coupons.filter((c: any) => c.active).length,
    };

    const pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: coupons.length,
        itemsPerPage: 100,
    };

    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={null}>
                <CouponsTableClient
                    coupons={coupons}
                    stats={stats}
                    pagination={pagination}
                    isSuperAdmin={true}
                />
            </Suspense>
        </div>
    );
}
