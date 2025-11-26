import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import AnalyticsChartsDetailed from "@/components/admin/AnalyticsChartsDetailed";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function validateAdminAccess() {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');

        if (!tokenCookie) {
            return { isValid: false, user: null };
        }

        // Validate session with backend
        const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${tokenCookie.value}`,
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
        const isAdmin = user.role?.name === 'SUPER_ADMIN' || user.role?.name === 'ADMIN';

        return { isValid: isAdmin, user };
    } catch (error) {
        console.error('Admin validation error:', error);
        return { isValid: false, user: null };
    }
}

export default async function AdminPage() {
    const { isValid, user } = await validateAdminAccess();

    if (!isValid) {
        // Not authenticated or not admin, redirect to login
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold capitalize">Dashboard</h2>
            <AnalyticsOverview />
            <AnalyticsCharts />
            <AnalyticsChartsDetailed />
        </div>
    );
}
