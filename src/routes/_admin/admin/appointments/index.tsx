import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import AppointmentsTableClient from "@/components/admin/appointments/AppointmentsTableClient";

type Search = { tenantId?: string };

const getGlobalAppointments = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const [{ api }, { validateAdminAccess }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/lib/server-auth"),
        ]);
        const { isValid } = await validateAdminAccess();
        if (!isValid) return { unauthorized: true as const };

        const query = new URLSearchParams();
        if (data.tenantId) query.set("tenantId", data.tenantId);
        else query.set("tenantId", "all");

        const appointments =
            (await api
                .get<any[]>(`/appointments?${query.toString()}`)
                .catch(() => [])) || [];
        const statusCounts: Record<string, number> = {};
        appointments.forEach((a: any) => {
            statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
        });
        const stats = {
            totalAppointments: appointments.length,
            pendingAppointments: appointments.filter(
                (a: any) => a.status === "PENDING",
            ).length,
            confirmedAppointments: appointments.filter(
                (a: any) => a.status === "CONFIRMED",
            ).length,
            statusCounts,
        };
        const pagination = {
            currentPage: 1,
            totalPages: 1,
            totalItems: appointments.length,
            totalItemsPerPage: appointments.length,
        };
        return { appointments, stats, pagination };
    });

export const Route = createFileRoute("/_admin/admin/appointments/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        tenantId:
            typeof search.tenantId === "string" ? search.tenantId : undefined,
    }),
    loaderDeps: ({ search }) => ({ tenantId: search.tenantId }),
    loader: async ({ deps }) => {
        const result = await getGlobalAppointments({ data: deps });
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
    component: AdminAppointmentsRoute,
});

function AdminAppointmentsRoute() {
    const { appointments, stats, pagination } = Route.useLoaderData();
    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Citas globales
            </h2>
            <AppointmentsTableClient
                appointments={appointments}
                stats={stats}
                pagination={pagination}
                isSuperAdmin={true}
            />
        </div>
    );
}
