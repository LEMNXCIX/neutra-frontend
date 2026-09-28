import { redirect } from "next/navigation";
import { Suspense } from "react";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";
import { api } from "@/lib/api-client";
import { validateAdminAccess } from "@/lib/server-auth";

export const metadata = { title: "Anuncios" };

export const dynamic = "force-dynamic";

export default async function BookingBannersPage() {
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const banners = (await api.get<any[]>(`/banners`).catch(() => [])) || [];

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
                />
            </Suspense>
        </div>
    );
}
