import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";

type Search = { tenantId?: string };

const getGlobalCoupons = createServerFn({ method: "GET" })
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

        const coupons =
            (await api
                .get<any[]>(`/coupons?${query.toString()}`)
                .catch(() => [])) || [];
        const stats = {
            totalCoupons: coupons.length,
            usedCoupons: coupons.filter((c: any) => c.usageCount > 0).length,
            unusedCoupons: coupons.filter((c: any) => c.usageCount === 0)
                .length,
            expiredCoupons: coupons.filter(
                (c: any) => c.expiresAt && new Date(c.expiresAt) < new Date(),
            ).length,
            activeCoupons: coupons.filter((c: any) => c.active).length,
        };
        const pagination = {
            currentPage: 1,
            totalPages: 1,
            totalItems: coupons.length,
            itemsPerPage: 100,
        };
        return { coupons, stats, pagination };
    });

export const Route = createFileRoute("/_admin/admin/coupons/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        tenantId:
            typeof search.tenantId === "string" ? search.tenantId : undefined,
    }),
    loaderDeps: ({ search }) => ({ tenantId: search.tenantId }),
    loader: async ({ deps }) => {
        const result = await getGlobalCoupons({ data: deps });
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
    component: AdminCouponsRoute,
});

function AdminCouponsRoute() {
    const { coupons, stats, pagination } = Route.useLoaderData();
    return (
        <div className="container mx-auto py-8">
            <CouponsTableClient
                coupons={coupons}
                stats={stats}
                pagination={pagination}
                isSuperAdmin={true}
            />
        </div>
    );
}
