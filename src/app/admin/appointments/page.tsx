
import React from 'react';
import { redirect } from 'next/navigation';
import AppointmentsTableClient from "@/components/admin/appointments/AppointmentsTableClient";
import { validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';


export default async function GlobalAppointmentsPage({ searchParams }: { searchParams: any }) {
    const { isValid, cookieHeader } = await validateAdminAccess();
    if (!isValid) redirect('/login');

    const params = await searchParams;
    const query = new URLSearchParams(params);
    query.set('tenantId', query.get('tenantId') || 'all');

    const response = await fetch(`${BACKEND_API_URL}/appointments?${query.toString()}`, {
        headers: {
            'Cookie': cookieHeader!,
        },
        cache: 'no-store',
    });

    const data = await response.json();

    // Backend returns appointments directly in 'data' array
    const appointments = data.data || [];

    // Calculate stats from the appointments matching the Stats type
    const statusCounts: Record<string, number> = {};
    appointments.forEach((a: any) => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });

    const stats = {
        totalAppointments: appointments.length,
        pendingAppointments: appointments.filter((a: any) => a.status === 'PENDING').length,
        confirmedAppointments: appointments.filter((a: any) => a.status === 'CONFIRMED').length,
        statusCounts,
    };

    const pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: appointments.length,
        totalItemsPerPage: appointments.length,
    };

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Global Appointments</h2>
            <AppointmentsTableClient
                appointments={appointments}
                stats={stats}
                pagination={pagination}
                isSuperAdmin={true}
            />
        </div>
    );
}
