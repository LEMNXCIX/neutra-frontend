import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";

type Search = {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
};

const getSlidersData = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const [{ api }, { validateAdminAccess }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/lib/server-auth"),
        ]);
        const page =
            typeof data.page === "string" ? parseInt(data.page, 10) : 1;
        const limit =
            typeof data.limit === "string" ? parseInt(data.limit, 10) : 10;
        const search = data.search ?? "";
        const status = data.status ?? "all";

        try {
            const adminCheck = await validateAdminAccess();
            const isSuperAdmin =
                adminCheck.isValid &&
                adminCheck.user?.role?.name === "SUPER_ADMIN";
            const endpoint = isSuperAdmin ? "/slide?tenantId=all" : "/slide";
            const result = await api.get<any[]>(endpoint);
            let sliders: any[] = Array.isArray(result) ? result : [];

            if (search) {
                const query = search.toLowerCase();
                sliders = sliders.filter(
                    (s) =>
                        s.title?.toLowerCase().includes(query) ||
                        s.subtitle?.toLowerCase().includes(query),
                );
            }
            if (status && status !== "all") {
                if (status === "active")
                    sliders = sliders.filter((s) => s.active);
                else if (status === "inactive")
                    sliders = sliders.filter((s) => !s.active);
            }

            const totalSliders = sliders.length;
            const activeSliders = sliders.filter((s) => s.active).length;
            const startIndex = (page - 1) * limit;
            return {
                sliders: sliders.slice(startIndex, startIndex + limit),
                stats: {
                    totalSliders,
                    activeSliders,
                    inactiveSliders: totalSliders - activeSliders,
                    withImages: sliders.filter((s) => s.img).length,
                },
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalSliders / limit),
                    totalItems: totalSliders,
                    itemsPerPage: limit,
                },
            };
        } catch (err) {
            console.error("Error fetching sliders:", err);
            return {
                sliders: [],
                stats: {
                    totalSliders: 0,
                    activeSliders: 0,
                    inactiveSliders: 0,
                    withImages: 0,
                },
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                },
            };
        }
    });

export const Route = createFileRoute("/_storeAdmin/store-admin/sliders/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        page: typeof search.page === "string" ? search.page : undefined,
        limit: typeof search.limit === "string" ? search.limit : undefined,
        search: typeof search.search === "string" ? search.search : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    loaderDeps: ({ search }) => ({
        page: search.page,
        limit: search.limit,
        search: search.search,
        status: search.status,
    }),
    loader: ({ deps }) => getSlidersData({ data: deps }),
    head: () => ({
        meta: [
            { title: "Carruseles" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: StoreAdminSlidersRoute,
});

function StoreAdminSlidersRoute() {
    const { sliders, stats, pagination } = Route.useLoaderData();
    return (
        <SlidersTableClient
            sliders={sliders}
            stats={stats}
            pagination={pagination}
        />
    );
}
