import { redirect } from "next/navigation";
import { Suspense } from "react";
import ServicesTableClient from "@/components/admin/booking/ServicesTableClient";
import { api } from "@/lib/api-client";
import { validateAdminAccess } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function SuperAdminServicesPage({
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

    const [servicesData, categoriesData] = await Promise.all([
        api.get<any[]>(`/services?${query.toString()}`).catch(() => []),
        api.get<any[]>(`/categories?tenantId=all&type=SERVICE`).catch(() => []),
    ]);

    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={null}>
                <ServicesTableClient
                    services={Array.isArray(servicesData) ? servicesData : []}
                    categories={
                        Array.isArray(categoriesData) ? categoriesData : []
                    }
                    isSuperAdmin={true}
                />
            </Suspense>
        </div>
    );
}
