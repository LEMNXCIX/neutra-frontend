import React from "react";
import { LogsClient } from "@/components/admin/logs/logs-client";
import { getBackendUrl } from "@/lib/backend-api";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

async function getData() {
    try {
        const baseUrl = getBackendUrl();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Cookie': `token=${token}` }),
        };

        // Fetch logs and tenants in parallel
        const [logsRes, tenantsRes] = await Promise.all([
            fetch(`${baseUrl}/admin/logs?take=50`, { headers, cache: 'no-store' }),
            fetch(`${baseUrl}/tenants`, { headers, cache: 'no-store' })
        ]);

        const logsData = await logsRes.json();
        const tenantsData = await tenantsRes.json();

        return {
            logs: logsData.data || [],
            total: logsData.pagination?.total || 0,
            tenants: tenantsData.data || tenantsData || []
        };
    } catch (error) {
        console.error("Error fetching logs data on server:", error);
        return { logs: [], total: 0, tenants: [] };
    }
}

export default async function LogsPage() {
    const { logs, total, tenants } = await getData();

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-[1600px] mx-auto min-h-screen bg-background text-foreground transition-colors duration-300">
            <LogsClient 
                initialLogs={logs} 
                initialTotal={total} 
                tenants={tenants} 
            />
        </div>
    );
}
