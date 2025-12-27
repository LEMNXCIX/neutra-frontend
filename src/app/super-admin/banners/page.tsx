import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";
import { bannersService } from "@/services/banners.service";

export default async function SuperAdminBannersPage({
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
    // Note: Banners API returns paginated data or array depending on parameters.
    // In some tables we used a wrapped response. Let's check banner service.
    // bannersService.getAll(tenantId) returns Banner[].
    // But the component expects { banners, stats, pagination }.
    // Actually the component Props said: banners: Banner[]; stats: Stats; pagination: PaginationProps;

    // We might need to adjust the fetching to match the expected Props of the client component.
    // For now let's fetch basic ones and see.
    const banners = await bannersService.getAll(tenantId);

    // Minimal stats for now
    const stats = {
        totalBanners: banners.length,
        activeBanners: banners.filter(b => b.active).length,
        inactiveBanners: banners.filter(b => !b.active).length,
    };

    const pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: banners.length,
        itemsPerPage: 100,
    };

    return (
        <div className="container mx-auto py-8">
            <BannersTableClient
                banners={banners}
                stats={stats}
                pagination={pagination}
                isSuperAdmin={true}
            />
        </div>
    );
}
