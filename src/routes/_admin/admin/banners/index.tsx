import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import BannersTableClient from "@/components/admin/banners/BannersTableClient";

type Search = {
    tenantId?: string;
    page?: string;
    search?: string;
    status?: string;
};

const getGlobalBanners = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const [{ api }, { validateAdminAccess }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/lib/server-auth"),
        ]);
        const { isValid } = await validateAdminAccess();
        if (!isValid) return { unauthorized: true as const };

        const tenantId = data.tenantId === "all" ? undefined : data.tenantId;
        const query = new URLSearchParams();
        if (tenantId) query.append("tenantId", tenantId);

        // /banners/all/list is the admin endpoint (all banners incl. inactive,
        // resolveSuperAdminTenant honors the tenantId filter).
        const banners =
            (await api
                .get<any[]>(`/banners/all/list?${query.toString()}`)
                .catch(() => [])) || [];
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

export const Route = createFileRoute("/_admin/admin/banners/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        tenantId:
            typeof search.tenantId === "string" ? search.tenantId : undefined,
        page: typeof search.page === "string" ? search.page : undefined,
        search: typeof search.search === "string" ? search.search : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    loaderDeps: ({ search }) => ({
        tenantId: search.tenantId,
        page: search.page,
        search: search.search,
        status: search.status,
    }),
    loader: async ({ deps }) => {
        const result = await getGlobalBanners({ data: deps });
        if ("unauthorized" in result) throw redirect({ to: "/login" });
        return result;
    },
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: AdminBannersRoute,
});

function AdminBannersRoute() {
    const { banners, stats, pagination } = Route.useLoaderData();
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
