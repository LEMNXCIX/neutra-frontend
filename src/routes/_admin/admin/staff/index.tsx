import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import StaffTableClient from "@/components/admin/booking/StaffTableClient";

type Search = { tenantId?: string };

const getGlobalStaff = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const [{ api }, { validateAdminAccess }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/lib/server-auth"),
        ]);
        const { isValid } = await validateAdminAccess();
        if (!isValid) return { unauthorized: true as const };

        const tenantId =
            data.tenantId === "all" ? undefined : data.tenantId || "all";
        const query = new URLSearchParams();
        query.append("activeOnly", "false");
        query.append("tenantId", tenantId === undefined ? "all" : tenantId);
        const result = await api
            .get<any[]>(`/staff?${query.toString()}`)
            .catch(() => ({}));
        return { staff: result };
    });

export const Route = createFileRoute("/_admin/admin/staff/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        tenantId:
            typeof search.tenantId === "string" ? search.tenantId : undefined,
    }),
    loaderDeps: ({ search }) => ({ tenantId: search.tenantId }),
    loader: async ({ deps }) => {
        const result = await getGlobalStaff({ data: deps });
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
    component: AdminStaffRoute,
});

function AdminStaffRoute() {
    const { staff } = Route.useLoaderData();
    return (
        <div className="container mx-auto py-8">
            <StaffTableClient
                staff={Array.isArray(staff) ? staff : []}
                isSuperAdmin={true}
            />
        </div>
    );
}
