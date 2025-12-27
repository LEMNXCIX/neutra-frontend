
import React from 'react';
import { redirect } from "next/navigation";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";
import { slidersService } from "@/services/sliders.service";
import { validateAdminAccess } from "@/lib/server-auth";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default async function SuperAdminSlidersPage({
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
    const response = await fetch(`${BACKEND_API_URL}/slide?${query.toString()}`, {
        headers: { 'Cookie': cookieHeader! },
        cache: 'no-store'
    });
    const result = await response.json();
    const sliders = result.data || [];

    // Minimal stats for now
    const stats = {
        totalSliders: sliders.length,
        activeSliders: sliders.filter((s: any) => s.active).length,
        inactiveSliders: sliders.filter((s: any) => !s.active).length,
        withImages: sliders.filter((s: any) => !!s.img).length,
    };

    const pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: sliders.length,
        itemsPerPage: 100,
    };

    return (
        <div className="container mx-auto py-8">
            <SlidersTableClient
                sliders={sliders}
                stats={stats}
                pagination={pagination}
                isSuperAdmin={true}
            />
        </div>
    );
}
