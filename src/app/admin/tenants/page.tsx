import React from "react";
import { TenantsTable } from "@/components/admin/tenants/TenantsTable";
import { getBackendUrl } from "@/lib/backend-api";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

async function getTenants() {
    try {
        const baseUrl = getBackendUrl();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        const response = await fetch(`${baseUrl}/tenants`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Cookie': `token=${token}` }),
            },
            cache: 'no-store'
        });

        if (!response.ok) return [];
        const result = await response.json();
        return result.data || result || [];
    } catch (error) {
        console.error("Error fetching tenants on server:", error);
        return [];
    }
}

export default async function TenantsPage() {
    const tenants = await getTenants();

    return (
        <div className="space-y-6">
            <TenantsTable initialTenants={tenants} />
        </div>
    );
}
