import React from 'react';
import { cookies } from 'next/headers';
import StaffTableClient from '@/components/admin/booking/StaffTableClient';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getStaff() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';

        const response = await fetch(`${BACKEND_API_URL}/staff?activeOnly=false`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
                'x-tenant-slug': tenantSlug,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch staff:', response.status);
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (err) {
        console.error("Error fetching staff:", err);
        return [];
    }
}

export default async function AdminStaffPage() {
    const staff = await getStaff();

    return (
        <div className="p-6">
            <StaffTableClient staff={staff} />
        </div>
    );
}
