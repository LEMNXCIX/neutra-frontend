import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";
import { slidersService } from "@/services/sliders.service";

export default async function SuperAdminSlidersPage({
    searchParams,
}: {
    searchParams: { tenantId?: string; page?: string; search?: string; status?: string };
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("neutra_jwt")?.value;

    if (!token) {
        redirect("/login");
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    const tenantId = searchParams.tenantId === 'all' ? undefined : searchParams.tenantId;

    // Fetch data server-side
    const sliders = await slidersService.getAll(tenantId);

    // Minimal stats for now
    const stats = {
        totalSliders: sliders.length,
        activeSliders: sliders.filter(s => s.active).length,
        inactiveSliders: sliders.filter(s => !s.active).length,
        withImages: sliders.filter(s => !!s.img).length,
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
