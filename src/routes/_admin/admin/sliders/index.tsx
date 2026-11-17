import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";

type Search = {
    tenantId?: string;
    page?: string;
    search?: string;
    status?: string;
};

const getGlobalSliders = createServerFn({ method: "GET" })
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

        const sliders =
            (await api
                .get<any[]>(`/slide?${query.toString()}`)
                .catch(() => [])) || [];
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
        return { sliders, stats, pagination };
    });

export const Route = createFileRoute("/_admin/admin/sliders/")({
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
        const result = await getGlobalSliders({ data: deps });
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
    component: AdminSlidersRoute,
});

function AdminSlidersRoute() {
    const { sliders, stats, pagination } = Route.useLoaderData();
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
