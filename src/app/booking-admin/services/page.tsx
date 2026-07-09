import React, { Suspense } from "react";
import ServicesTableClient from "@/components/admin/booking/ServicesTableClient";
import { api } from '@/lib/api-client';

export const metadata = { title: "Booking Services" };

export const dynamic = "force-dynamic";

async function getData() {
    try {
        const [servicesData, categoriesData] = await Promise.all([
            api.get<any[]>(`/services?activeOnly=false`).catch(() => []),
            api.get<any[]>('/categories').catch(() => []),
        ]);

        return {
            services: Array.isArray(servicesData) ? servicesData : [],
            categories: Array.isArray(categoriesData) ? categoriesData : [],
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
            <Suspense fallback={null}>
                <ServicesTableClient
                    services={data.services}
                    categories={data.categories}
                />
            </Suspense>
        </div>
    );
}
