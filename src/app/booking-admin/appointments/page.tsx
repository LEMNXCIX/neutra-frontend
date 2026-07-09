import React, { Suspense } from "react";
import AppointmentsTableClient from "@/components/admin/appointments/AppointmentsTableClient";
import { Appointment } from "@/services/booking.service";
import { api } from '@/lib/api-client';

export const metadata = { title: "Appointments" };

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

        const data = await api.get<{ data: any[]; stats?: any; pagination?: any }>(`/appointments?${params.toString()}`);
        const appointments: Appointment[] = data?.data || [];

        // In a real scenario, the backend might return these stats.
        // If not, we calculate them from the current result set as a fallback,
        // though full stats should ideally come from backend.
        const stats = {
            totalAppointments: appointments.length, // Fallback if backend doesn't provide total
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

        // If backend provides pagination info, use it
        const pagination = data?.pagination
            ? {
                  ...data.pagination,
                  totalItemsPerPage:
                      data.pagination.itemsPerPage ||
                      data.pagination.limit ||
                      limit,
              }
            : {
                  currentPage: page,
                  totalPages: Math.ceil(appointments.length / limit),
                  totalItems: appointments.length,
                  totalItemsPerPage: limit,
              };

        return {
            appointments,
            stats: data.stats || stats,
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
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
