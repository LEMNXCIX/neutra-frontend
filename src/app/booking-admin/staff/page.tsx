import React, { Suspense } from "react";
import StaffTableClient from "@/components/admin/booking/StaffTableClient";
import { api } from '@/lib/api-client';

export const metadata = { title: "Booking Staff" };

export const dynamic = "force-dynamic";

async function getStaff() {
    try {
        const data = await api.get<any[]>('/staff?activeOnly=false');
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error("Error fetching staff:", err);
        return [];
    }
}

export default async function AdminStaffPage() {
    const staff = await getStaff();

    return (
        <div className="p-6">
            <Suspense fallback={null}>
                <StaffTableClient staff={staff} />
            </Suspense>
        </div>
    );
}
