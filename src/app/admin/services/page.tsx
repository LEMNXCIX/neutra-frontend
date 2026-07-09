import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import ServicesTableClient from "@/components/admin/booking/ServicesTableClient";
import { bookingService } from "@/services/booking.service";
import { categoriesService } from "@/services/categories.service";
import { validateAdminAccess } from "@/lib/server-auth";
import { api } from '@/lib/api-client';

export default async function SuperAdminServicesPage({
    searchParams,
}: {
    searchParams: { tenantId?: string };
}) {
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    const tenantId =
        params.tenantId === "all" ? undefined : params.tenantId || "all";

    const query = new URLSearchParams();
    query.append("activeOnly", "false");
    query.append("tenantId", tenantId === undefined ? "all" : tenantId);

    const [servicesData, categoriesData] = await Promise.all([
        api.get<any[]>(`/services?${query.toString()}`).catch(() => []),
        api.get<any[]>(`/categories?tenantId=all&type=SERVICE`).catch(() => []),
    ]);

    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={null}>
                <ServicesTableClient
                    services={Array.isArray(servicesData) ? servicesData : []}
                    categories={Array.isArray(categoriesData) ? categoriesData : []}
                    isSuperAdmin={true}
                />
            </Suspense>
        </div>
    );
}
