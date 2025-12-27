import React from 'react';
import { cookies } from 'next/headers';
import ServicesTableClient from '@/components/admin/booking/ServicesTableClient';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getData() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';

        const [servicesRes, categoriesRes] = await Promise.all([
            fetch(`${BACKEND_API_URL}/services?activeOnly=false`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookieString,
                    'x-tenant-slug': tenantSlug,
                },
                cache: 'no-store',
            }),
            fetch(`${BACKEND_API_URL}/categories`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookieString,
                    'x-tenant-slug': tenantSlug,
                },
                cache: 'no-store',
            })
        ]);

        const servicesData = servicesRes.ok ? await servicesRes.json() : { data: [] };
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { data: [] };

        return {
            services: servicesData.data || [],
            categories: categoriesData.data || []
        };
    } catch (err) {
        console.error("Error fetching services data:", err);
        return { services: [], categories: [] };
    }
}

export default async function AdminServicesPage() {
    const data = await getData();

    return (
        <div className="p-6">
            <ServicesTableClient
                services={data.services}
                categories={data.categories}
            />
        </div>
    );
}
