import React, { Suspense } from "react";
import AppointmentsTableClient from "@/components/admin/appointments/AppointmentsTableClient";
import { Appointment } from "@/services/booking.service";
import { api } from '@/lib/api-client';

export const metadata = { title: "Citas" };

export const dynamic = "force-dynamic";

async function getAppointments(
    search: string,
    status: string,
    page: number,
    limit: number,
) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (search) params.append("search", search);
        if (status && status !== "all") params.append("status", status);

        // getWithMeta keeps meta.pagination — the backend now returns real
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

        // Map the backend page metadata to the table's pagination shape.
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

        return {
            appointments,
            stats,
            pagination,
        };
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
}

type Props = {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        status?: string;
    }>;
};

export default async function AppointmentsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page =
        typeof resolvedSearchParams.page === "string"
            ? parseInt(resolvedSearchParams.page)
            : 1;
    const limit =
        typeof resolvedSearchParams.limit === "string"
            ? parseInt(resolvedSearchParams.limit)
            : 10;
    const search =
        typeof resolvedSearchParams.search === "string"
            ? resolvedSearchParams.search
            : "";
    const status =
        typeof resolvedSearchParams.status === "string"
            ? resolvedSearchParams.status
            : "all";

    const data = await getAppointments(search, status, page, limit);

    return (
        <div className="w-full">
            <Suspense fallback={null}>
                <AppointmentsTableClient
                    appointments={data.appointments}
                    stats={data.stats}
                    pagination={data.pagination}
                />
            </Suspense>
        </div>
    );
}
