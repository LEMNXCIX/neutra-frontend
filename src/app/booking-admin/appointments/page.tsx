import React from "react";
import { cookies } from 'next/headers';
import AppointmentsTableClient from "@/components/admin/appointments/AppointmentsTableClient";
import { Appointment } from "@/services/booking.service";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getAppointments(search: string, status: string, page: number, limit: number) {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (search) params.append('search', search);
        if (status && status !== 'all') params.append('status', status);

        const response = await fetch(`${BACKEND_API_URL}/appointments?${params.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
                'x-tenant-slug': tenantSlug,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch appointments:', response.status);
            return {
                appointments: [],
                stats: { totalAppointments: 0, pendingAppointments: 0, confirmedAppointments: 0, statusCounts: {} },
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit },
            };
        }

        const data = await response.json();
        const appointments: Appointment[] = data.data || [];

        // In a real scenario, the backend might return these stats. 
        // If not, we calculate them from the current result set as a fallback, 
        // though full stats should ideally come from backend.
        const stats = {
            totalAppointments: appointments.length, // Fallback if backend doesn't provide total
            pendingAppointments: appointments.filter(a => a.status === 'PENDING').length,
            confirmedAppointments: appointments.filter(a => a.status === 'CONFIRMED').length,
            statusCounts: appointments.reduce((acc: Record<string, number>, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {}),
        };

        // If backend provides pagination info, use it
        const pagination = data.pagination || {
            currentPage: page,
            totalPages: Math.ceil(appointments.length / limit),
            totalItems: appointments.length,
            itemsPerPage: limit,
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
            stats: { totalAppointments: 0, pendingAppointments: 0, confirmedAppointments: 0, statusCounts: {} },
            pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit },
        };
    }
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AppointmentsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "all";

    const data = await getAppointments(search, status, page, limit);

    return (
        <div className="w-full">
            <AppointmentsTableClient
                appointments={data.appointments}
                stats={data.stats}
                pagination={data.pagination}
            />
        </div>
    );
}
