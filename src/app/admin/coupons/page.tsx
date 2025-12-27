
import React from 'react';
import { redirect } from "next/navigation";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";
import { couponsService } from "@/services/coupons.service";
import { validateAdminAccess } from "@/lib/server-auth";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default async function SuperAdminCouponsPage({
    searchParams,
}: {
    searchParams: { tenantId?: string };
}) {
    const { isValid, cookieHeader } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    const tenantId = params.tenantId === 'all' ? undefined : params.tenantId;

    const query = new URLSearchParams();
    if (tenantId) query.append('tenantId', tenantId);

    // Fetch data server-side
    const response = await fetch(`${BACKEND_API_URL}/coupons?${query.toString()}`, {
        headers: { 'Cookie': cookieHeader! },
        cache: 'no-store'
    });
    const result = await response.json();
    const coupons = result.data || [];

    // Filter logic if needed or just provide initial stats
    const stats = {
        totalCoupons: coupons.length,
        usedCoupons: coupons.filter((c: any) => c.usageCount > 0).length,
        unusedCoupons: coupons.filter((c: any) => c.usageCount === 0).length,
        expiredCoupons: coupons.filter((c: any) => c.expiresAt && new Date(c.expiresAt) < new Date()).length,
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
            <CouponsTableClient
                coupons={coupons}
                stats={stats}
                pagination={pagination}
                isSuperAdmin={true}
            />
        </div>
    );
}
