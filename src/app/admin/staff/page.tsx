
import React from 'react';
import { redirect } from "next/navigation";
import StaffTableClient from "@/components/admin/booking/StaffTableClient";
import { bookingService } from "@/services/booking.service";
import { validateAdminAccess } from "@/lib/server-auth";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default async function SuperAdminStaffPage({
    searchParams,
}: {
    searchParams: { tenantId?: string };
}) {
    const { isValid, cookieHeader } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    // Default to 'all' if no tenantId is specified
    const tenantId = params.tenantId === 'all' ? undefined : (params.tenantId || 'all');

    const query = new URLSearchParams();
    query.append('activeOnly', 'false');
    // Always append tenantId, even if it's 'all'
    query.append('tenantId', tenantId === undefined ? 'all' : tenantId);

    // Fetch data server-side
    const response = await fetch(`${BACKEND_API_URL}/staff?${query.toString()}`, {
        headers: { 'Cookie': cookieHeader! },
        cache: 'no-store'
    });
    const data = await response.json();

    return (
        <div className="container mx-auto py-8">
            <StaffTableClient
                staff={data.data || []}
                isSuperAdmin={true}
            />
        </div>
    );
}
