import React from "react";
import { TenantsTable } from "@/components/admin/tenants/TenantsTable";
import { api } from '@/lib/api-client';

export const dynamic = "force-dynamic";

async function getTenants() {
    try {
        return await api.get<any[]>('/tenants') || [];
    } catch (error) {
        console.error("Error fetching tenants on server:", error);
        return [];
    }
}

async function getPlatformFeatures() {
    try {
        return await api.get<any[]>('/features') || [];
    } catch (error) {
        console.error("Error fetching features on server:", error);
        return [];
    }
}

export default async function TenantsPage() {
    const [tenants, platformFeatures] = await Promise.all([
        getTenants(),
        getPlatformFeatures(),
    ]);

    return (
        <div className="space-y-6">
            <TenantsTable
                initialTenants={tenants}
                initialPlatformFeatures={platformFeatures}
            />
        </div>
    );
}
