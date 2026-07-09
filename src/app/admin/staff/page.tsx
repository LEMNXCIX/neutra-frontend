import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import StaffTableClient from "@/components/admin/booking/StaffTableClient";
import { bookingService } from "@/services/booking.service";
import { validateAdminAccess } from "@/lib/server-auth";
import { api } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export default async function SuperAdminStaffPage({
    searchParams,
}: {
    searchParams: Promise<{ tenantId?: string }>;
}) {
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    const tenantId =
        params.tenantId === "all" ? undefined : params.tenantId || "all";

    const query = new URLSearchParams();
    query.append("activeOnly", "false");
    query.append("tenantId", tenantId === undefined ? "all" : tenantId);

    const data = await api.get<any[]>(`/staff?${query.toString()}`).catch(() => ({}));

    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={null}>
                <StaffTableClient staff={Array.isArray(data) ? data : []} isSuperAdmin={true} />
            </Suspense>
        </div>
    );
}
