import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import AnalyticsChartsDetailed from "@/components/admin/AnalyticsChartsDetailed";
import { api } from '@/lib/api-client';

export const metadata = { title: "Booking Admin", };

export const dynamic = 'force-dynamic';

async function validateAdminAccess() {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');

        if (!tokenCookie) {
            return { isValid: false, user: null };
        }

        const authRes = await api.get<{ user: any }>('/auth/validate');

        if (!authRes?.user) {
            return { isValid: false, user: null };
        }

        const user = authRes.user;

        const isAdmin = user.role?.name === 'SUPER_ADMIN' || user.role?.name === 'ADMIN';

        return { isValid: isAdmin, user };
    } catch (error) {
        console.error('Admin validation error:', error);
        return { isValid: false, user: null };
    }
}

export default async function AdminPage() {
    const { isValid } = await validateAdminAccess();

    if (!isValid) {
        // Not authenticated or not admin, redirect to login
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold capitalize">Booking Dashboard</h2>
            <div className="p-4 border border-dashed rounded-lg bg-muted/50">
                <p className="text-muted-foreground">Manage your appointments, staff, and services here.</p>
            </div>
            {/* <AnalyticsOverview />
            <AnalyticsCharts />
            <AnalyticsChartsDetailed /> */}
        </div>
    );
}

