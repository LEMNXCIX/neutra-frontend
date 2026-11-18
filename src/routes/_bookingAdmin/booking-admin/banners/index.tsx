import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";

const getBannersData = createServerFn({ method: "GET" }).handler(async () => {
    const [{ api }, { validateAdminAccess }] = await Promise.all([
        import("@/lib/api-client"),
        import("@/lib/server-auth"),
    ]);
    const { isValid } = await validateAdminAccess();
    if (!isValid) return { unauthorized: true as const };

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
    return { banners, stats, pagination };
});

export const Route = createFileRoute("/_bookingAdmin/booking-admin/banners/")({
    loader: async () => {
        const data = await getBannersData();
        if ("unauthorized" in data) throw redirect({ to: "/login" });
        return data;
    },
    head: () => ({
        meta: [
            { title: "Anuncios" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: BookingAdminBannersRoute,
});

function BookingAdminBannersRoute() {
    const { banners, stats, pagination } = Route.useLoaderData();
    return (
        <div className="container mx-auto py-8">
            <BannersTableClient
                banners={banners}
                stats={stats}
                pagination={pagination}
            />
        </div>
    );
}
