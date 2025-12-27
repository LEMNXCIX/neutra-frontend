
import React from 'react';
import { redirect } from "next/navigation";
import ServicesTableClient from "@/components/admin/booking/ServicesTableClient";
import { bookingService } from "@/services/booking.service";
import { categoriesService } from "@/services/categories.service";
import { validateAdminAccess } from "@/lib/server-auth";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default async function SuperAdminServicesPage({
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

    const [servicesRes, categoriesRes] = await Promise.all([
        fetch(`${BACKEND_API_URL}/services?${query.toString()}`, {
            headers: { 'Cookie': cookieHeader! },
            cache: 'no-store'
        }),
        fetch(`${BACKEND_API_URL}/categories?tenantId=all&type=SERVICE`, {
            headers: { 'Cookie': cookieHeader! },
            cache: 'no-store'
        })
    ]);

    const servicesData = await servicesRes.json();
    const categoriesData = await categoriesRes.json();

    return (
        <div className="container mx-auto py-8">
            <ServicesTableClient
                services={servicesData.data || []}
                categories={categoriesData.data || []}
                isSuperAdmin={true}
            />
        </div>
    );
}
