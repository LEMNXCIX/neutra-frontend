import React from "react";
import { LogsClient } from "@/components/admin/logs/logs-client";
import { api } from '@/lib/api-client';

export const dynamic = "force-dynamic";

async function getData() {
    try {
        const [logsResult, tenantsResult] = await Promise.all([
            api.get<any>(`/admin/logs?take=50`).catch(() => ({ data: [], pagination: {} })),
            api.get<any[]>('/tenants').catch(() => []),
        ]);
        return {
            logs: logsResult?.data || [],
            total: logsResult?.pagination?.total || 0,
            tenants: Array.isArray(tenantsResult) ? tenantsResult : [],
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
