import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import AnalyticsChartsDetailed from "@/components/admin/AnalyticsChartsDetailed";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function validateAdminAccess() {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');

        if (!tokenCookie) {
            return { isValid: false, user: null };
        }

        // Serialize all cookies to forward to backend
        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');

        // Validate session with backend
        const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return { isValid: false, user: null };
        }

        const data = await response.json();

        if (!data.success || !data.data?.user) {
            return { isValid: false, user: null };
        }

        const user = data.data.user;

        // Check if user has admin role
        const isAdmin = user.role?.name === 'SUPER_ADMIN';

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

