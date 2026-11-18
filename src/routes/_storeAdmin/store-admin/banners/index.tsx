import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";

const getBannersData = createServerFn({ method: "GET" }).handler(async () => {
    const [{ api }, { validateAdminAccess }] = await Promise.all([
        import("@/lib/api-client"),
        import("@/lib/server-auth"),
    ]);
    try {
        const adminCheck = await validateAdminAccess();
        const isSuperAdmin =
            adminCheck.isValid && adminCheck.user?.role?.name === "SUPER_ADMIN";
        const endpoint = isSuperAdmin
            ? "/banners/all/list?tenantId=all"
            : "/banners/all/list";
        const result = await api.get<any[]>(endpoint);
        const banners = Array.isArray(result) ? result : [];
        const totalBanners = banners.length;
        const activeBanners = banners.filter(
            (b: { active?: boolean }) => b.active,
        ).length;
        const withImages = banners.filter(
            (b: { image?: string }) => b.image,
        ).length;
        return {
            banners,
            stats: {
                totalBanners,
                activeBanners,
                inactiveBanners: totalBanners - activeBanners,
                withImages,
            },
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: totalBanners,
                itemsPerPage: totalBanners > 0 ? totalBanners : 10,
            },
            error: undefined as string | undefined,
        };
    } catch (err: any) {
        console.error("Error fetching banners:", err);
        return {
            banners: [],
            stats: {
                totalBanners: 0,
                activeBanners: 0,
                inactiveBanners: 0,
                withImages: 0,
            },
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: 10,
            },
            error: err.message || "Excepción al obtener los banners",
        };
    }
});

export const Route = createFileRoute("/_storeAdmin/store-admin/banners/")({
    loader: () => getBannersData(),
    head: () => ({
        meta: [
            { title: "Anuncios" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: StoreAdminBannersRoute,
});

function StoreAdminBannersRoute() {
    const data = Route.useLoaderData();
    return (
        <div className="space-y-4">
            {data.error && (
                <div
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                    role="alert"
                >
                    <strong className="font-bold">Error al cargar: </strong>
                    <span className="block sm:inline">{data.error}</span>
                </div>
            )}
            <BannersTableClient
                banners={data.banners}
                stats={data.stats}
                pagination={data.pagination}
            />
        </div>
    );
}
