import React from 'react';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/backend-api';
import { BookingWizard } from '@/components/booking/booking-wizard';

export const dynamic = 'force-dynamic';

async function getData() {
    try {
        const baseUrl = getBackendUrl();
        const cookieStore = await cookies();
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';
        const tenantId = cookieStore.get('tenant-id')?.value || '';

        const headers = {
            'Content-Type': 'application/json',
            'x-tenant-slug': tenantSlug,
            'x-tenant-id': tenantId
        };

        // Fetch services and staff in parallel
        const [servicesRes, staffRes] = await Promise.all([
            fetch(`${baseUrl}/services?activeOnly=true`, { headers, cache: 'no-store' }),
            fetch(`${baseUrl}/staff?activeOnly=true`, { headers, cache: 'no-store' })
        ]);

        const servicesData = await servicesRes.json();
        const staffData = await staffRes.json();

        return {
            services: servicesData.data || [],
            staff: staffData.data || []
        };
    } catch (error) {
        console.error('Error fetching booking wizard data on server:', error);
        return { services: [], staff: [] };
    }
}

export default async function BookPage(props: { searchParams: Promise<{ serviceId?: string }> }) {
    const searchParams = await props.searchParams;
    const { services, staff } = await getData();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                        Book an <span className="text-primary">Appointment</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Complete the steps below to schedule your appointment
                    </p>
                </div>

                <BookingWizard 
                    initialServices={services}
                    initialStaff={staff}
                    preSelectedServiceId={searchParams.serviceId}
                />
            </div>
        </div>
    );
}
