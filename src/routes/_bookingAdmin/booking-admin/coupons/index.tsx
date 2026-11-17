import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";

const PER_PAGE = 10;

type Search = {
    page?: string;
    limit?: string;
    search?: string;
    type?: string;
    status?: string;
};

const getCouponsData = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const { api } = await import("@/lib/api-client");
        const page =
            typeof data.page === "string" ? parseInt(data.page, 10) : 1;
        const limit =
            typeof data.limit === "string" ? parseInt(data.limit, 10) : 10;
        const search = data.search ?? "";
        const type = data.type ?? "all";
        const status = data.status ?? "all";

        // Coupons are a small config list: fetch complete (no page/limit) and
        // paginate client-side — the backend's paginated branch drops `total`.
        try {
            const queryParams = new URLSearchParams();
            if (search) queryParams.set("search", search);
            if (type && type !== "all") queryParams.set("type", type);
            if (status && status !== "all") queryParams.set("status", status);
            const queryString = queryParams.toString();
            const result = await api.get<any>(
                `/coupons${queryString ? `?${queryString}` : ""}`,
            );
            const allCoupons: any[] = Array.isArray(result) ? result : [];
            const now = new Date();
            const stats = {
                totalCoupons: allCoupons.length,
                usedCoupons: allCoupons.filter((c) => c.usageCount > 0).length,
                unusedCoupons: allCoupons.filter((c) => !c.usageCount).length,
                expiredCoupons: allCoupons.filter(
                    (c) => c.expiresAt && new Date(c.expiresAt) < now,
                ).length,
                activeCoupons: allCoupons.filter((c) => c.active).length,
                activeDiscounts: allCoupons.filter((c) => c.active).length,
            };
            return {
                coupons: allCoupons.slice(
                    (page - 1) * PER_PAGE,
                    page * PER_PAGE,
                ),
                stats,
                pagination: {
                    currentPage: page,
                    totalPages: Math.max(
                        1,
                        Math.ceil(allCoupons.length / PER_PAGE),
                    ),
                    totalItems: allCoupons.length,
                    itemsPerPage: PER_PAGE,
                },
            };
        } catch (err) {
            console.error("Error fetching coupons:", err);
            return {
                coupons: [],
                stats: {
                    totalCoupons: 0,
                    usedCoupons: 0,
                    unusedCoupons: 0,
                    expiredCoupons: 0,
                    activeCoupons: 0,
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

export const Route = createFileRoute("/_bookingAdmin/booking-admin/coupons/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        page: typeof search.page === "string" ? search.page : undefined,
        limit: typeof search.limit === "string" ? search.limit : undefined,
        search: typeof search.search === "string" ? search.search : undefined,
        type: typeof search.type === "string" ? search.type : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    loaderDeps: ({ search }) => ({
        page: search.page,
        limit: search.limit,
        search: search.search,
        type: search.type,
        status: search.status,
    }),
    loader: ({ deps }) => getCouponsData({ data: deps }),
    head: () => ({
        meta: [
            {
                title: "Gestión de cupones | Administración de reservas",
            },
            {
                name: "description",
                content: "Administra cupones de descuento para citas",
            },
        ],
    }),
    component: BookingAdminCouponsRoute,
});

function BookingAdminCouponsRoute() {
    const { coupons, stats, pagination } = Route.useLoaderData();
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Cupones</h1>
            </div>
            <CouponsTableClient
                coupons={coupons}
                stats={stats}
                pagination={pagination}
            />
        </div>
    );
}
