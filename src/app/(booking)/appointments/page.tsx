import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppointmentsClient } from '@/components/booking/appointments-client';
import { authService } from '@/services/auth.service';
import { getBackendUrl } from '@/lib/backend-api';

export const dynamic = 'force-dynamic';

async function getInitialData() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';

        if (!token) return null;

        // 1. Validate user session
        const authRes = await authService.validate();
        const user = authRes?.user;
        if (!user) return null;

        const isStaff = user.role?.name === 'STAFF';
        const headers = {
            'Content-Type': 'application/json',
            'Cookie': `token=${token}`,
            'x-tenant-slug': tenantSlug
        };

        const baseUrl = getBackendUrl();

        // 2. Prepare parallel requests
        const requests: Promise<any>[] = [
            fetch(`${baseUrl}/appointments?userId=${user.id}`, { headers, cache: 'no-store' }).then(r => r.json())
        ];

        if (isStaff) {
            requests.push(fetch(`${baseUrl}/staff/me`, { headers, cache: 'no-store' }).then(r => r.json()));
        }

        // 3. Execute in parallel
        const results = await Promise.all(requests);
        
        const userAppointments = results[0]?.data || [];
        let staffProfile = null;
        let staffAppointments: any[] = [];

        if (isStaff && results[1]?.success) {
            staffProfile = results[1].data;
            if (staffProfile?.id) {
                const sAppsRes = await fetch(`${baseUrl}/appointments?staffId=${staffProfile.id}`, { headers, cache: 'no-store' });
                const sAppsData = await sAppsRes.json();
                staffAppointments = sAppsData.data || [];
            }
        }

        return {
            user,
            userAppointments,
            staffProfile,
            staffAppointments,
            isStaff
        };
    } catch (error) {
        console.error('Error fetching initial appointments data:', error);
        return null;
    }
}

export default async function AppointmentsPage(props: { searchParams: Promise<{ success?: string }> }) {
    const data = await getInitialData();
    const searchParams = await props.searchParams;

    if (!data) {
        redirect('/login?redirect=/appointments');
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                        My <span className="text-primary">Appointments</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {data.isStaff ? 'Manage your schedule and bookings' : 'Manage your upcoming and past appointments'}
                    </p>
                </div>

                <AppointmentsClient 
                    initialUserAppointments={data.userAppointments}
                    initialStaffAppointments={data.staffAppointments}
                    staffProfile={data.staffProfile}
                    isStaff={data.isStaff}
                    success={searchParams.success}
                />
            </div>
        </div>
    );
}
