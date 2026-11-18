import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import AppointmentsTableClient from "@/components/admin/appointments/AppointmentsTableClient";
import type { Appointment } from "@/services/booking.service";

type AppointmentsSearch = {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
};

const getAppointmentsData = createServerFn({ method: "GET" })
    .validator((data: AppointmentsSearch) => data)
    .handler(async ({ data }) => {
        const { api } = await import("@/lib/api-client");

        const search = data.search ?? "";
        const status = data.status ?? "all";
        const page =
            typeof data.page === "string" ? parseInt(data.page, 10) : 1;
        const limit =
            typeof data.limit === "string" ? parseInt(data.limit, 10) : 10;

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (search) params.append("search", search);
            if (status && status !== "all") params.append("status", status);

            // getWithMeta keeps meta.pagination — the backend returns real
            // pagination when page/limit are sent.
            const result = await api.getWithMeta<Appointment[]>(
                `/appointments?${params.toString()}`,
            );
            const appointments: Appointment[] = Array.isArray(result?.data)
                ? result.data
                : [];

            const stats = {
                totalAppointments: appointments.length,
                pendingAppointments: appointments.filter(
                    (a) => a.status === "PENDING",
                ).length,
                confirmedAppointments: appointments.filter(
                    (a) => a.status === "CONFIRMED",
                ).length,
                statusCounts: appointments.reduce(
                    (acc: Record<string, number>, curr) => {
                        acc[curr.status] = (acc[curr.status] || 0) + 1;
                        return acc;
                    },
                    {},
                ),
            };

            const paginationMeta = result?.meta?.pagination as
                | {
                      page?: number;
                      limit?: number;
                      total?: number;
                      totalPages?: number;
                  }
                | undefined;
            const resolvedLimit = paginationMeta?.limit ?? limit;
            const resolvedTotal = paginationMeta?.total ?? appointments.length;
            const pagination = {
                currentPage: paginationMeta?.page ?? page,
                totalPages:
                    paginationMeta?.totalPages ??
                    Math.ceil(resolvedTotal / resolvedLimit),
                totalItems: resolvedTotal,
                totalItemsPerPage: resolvedLimit,
            };

            return { appointments, stats, pagination };
        } catch (err) {
            console.error("Error fetching appointments:", err);
            return {
                appointments: [],
                stats: {
                    totalAppointments: 0,
                    pendingAppointments: 0,
                    confirmedAppointments: 0,
                    statusCounts: {},
                },
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    totalItemsPerPage: limit,
                },
            };
        }
    });

export const Route = createFileRoute(
    "/_bookingAdmin/booking-admin/appointments/",
)({
    validateSearch: (search: Record<string, unknown>): AppointmentsSearch => ({
        search: typeof search.search === "string" ? search.search : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
        page: typeof search.page === "string" ? search.page : undefined,
        limit: typeof search.limit === "string" ? search.limit : undefined,
    }),
    loaderDeps: ({ search }) => ({
        search: search.search ?? "",
        status: search.status ?? "all",
        page: search.page ?? "1",
        limit: search.limit ?? "10",
    }),
    loader: ({ deps }) => getAppointmentsData({ data: deps }),
    head: () => ({
        meta: [
            { title: "Citas" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: BookingAdminAppointmentsRoute,
});

function BookingAdminAppointmentsRoute() {
    const { appointments, stats, pagination } = Route.useLoaderData();
    return (
        <div className="w-full">
            <AppointmentsTableClient
                appointments={appointments}
                stats={stats}
                pagination={pagination}
            />
        </div>
    );
}
