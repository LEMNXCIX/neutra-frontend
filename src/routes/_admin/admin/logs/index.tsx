import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { LogsClient } from "@/components/admin/logs/logs-client";

const getLogsData = createServerFn({ method: "GET" }).handler(async () => {
    const { api } = await import("@/lib/api-client");
    try {
        const [logsResult, tenantsResult] = await Promise.all([
            api
                .get<any>(`/admin/logs?take=50`)
                .catch(() => ({ data: [], pagination: {} })),
            api.get<any[]>("/tenants").catch(() => []),
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
});

export const Route = createFileRoute("/_admin/admin/logs/")({
    loader: () => getLogsData(),
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: AdminLogsRoute,
});

function AdminLogsRoute() {
    const { logs, total, tenants } = Route.useLoaderData();
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
