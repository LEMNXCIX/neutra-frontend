import { redirect } from "next/navigation";
import { Suspense } from "react";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";
import { api } from "@/lib/api-client";
import { validateAdminAccess } from "@/lib/server-auth";

export const metadata = { title: "Carruseles" };

export const dynamic = "force-dynamic";

export default async function BookingSlidersPage() {
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const sliders = (await api.get<any[]>(`/slide`).catch(() => [])) || [];

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
            <Suspense fallback={null}>
                <SlidersTableClient
                    sliders={sliders}
                    stats={stats}
                    pagination={pagination}
                />
            </Suspense>
        </div>
    );
}
