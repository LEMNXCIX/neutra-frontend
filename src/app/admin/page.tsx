
import React from 'react';
import { redirect } from 'next/navigation';
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import AnalyticsChartsDetailed from "@/components/admin/AnalyticsChartsDetailed";
import { validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default async function AdminPage() {
    const { isValid } = await validateAdminAccess();

    if (!isValid) {
        // Not authenticated or not admin, redirect to login
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Super Admin Dashboard</h2>
            <div className="p-8 border-4 border-foreground bg-card rounded-none">
                <p className="text-muted-foreground font-bold">Select a module from the sidebar to manage tenants and global settings.</p>
            </div>
            {/* <AnalyticsOverview /> */}
            {/* <AnalyticsCharts /> */}
            {/* <AnalyticsChartsDetailed /> */}
        </div>
    );
}

