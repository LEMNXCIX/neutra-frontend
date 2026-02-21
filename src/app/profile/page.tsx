import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/profile-client";
import { authService } from "@/services/auth.service";
import { getBackendUrl } from "@/lib/backend-api";

export const dynamic = 'force-dynamic';

async function getData() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';
        const moduleType = cookieStore.get('module-type')?.value || 'root';

        if (!token) return null;

        // 1. Validate session
        const authRes = await authService.validate();
        const user = authRes?.user;
        if (!user) return null;

        const headers = {
            'Content-Type': 'application/json',
            'Cookie': `token=${token}`,
            'x-tenant-slug': tenantSlug
        };

        const baseUrl = getBackendUrl();
        const isNeutral = moduleType === 'root' || tenantSlug === 'superadmin';

        // 2. Conditional data fetching based on module
        const requests: Promise<any>[] = [];
        
        if (moduleType === 'store') {
            requests.push(fetch(`${baseUrl}/order/getOrderByUser`, { headers, cache: 'no-store' }).then(r => r.json()));
        } else if (moduleType === 'booking') {
            requests.push(fetch(`${baseUrl}/appointments?userId=${user.id}`, { headers, cache: 'no-store' }).then(r => r.json()));
        }

        const results = await Promise.all(requests);

        return {
            user,
            orders: moduleType === 'store' ? (results[0]?.data || []) : [],
            appointments: moduleType === 'booking' ? (results[0]?.data || []) : [],
            isNeutral,
            moduleType
        };
    } catch (error) {
        console.error("Error loading profile data on server:", error);
        return null;
    }
}

export default async function ProfilePage() {
    const data = await getData();

    if (!data) {
        redirect("/login?redirect=/profile");
    }

    return (
        <main className={`min-h-screen py-12 px-4 ${data.isNeutral ? 'bg-white' : 'bg-background'}`}>
            <div className="max-w-6xl mx-auto space-y-12">
                <div className={data.isNeutral ? "text-center" : ""}>
                    <h1 className={`font-black uppercase tracking-tighter ${data.isNeutral ? "text-6xl md:text-7xl mb-4" : "text-4xl mb-2"}`}>
                        {data.isNeutral ? "XCIX Profile" : "My Profile"}
                    </h1>
                    <p className="text-muted-foreground">
                        {data.isNeutral ? "Manage your global account settings" : "View your activity and account details"}
                    </p>
                </div>

                <ProfileClient 
                    initialOrders={data.orders}
                    initialAppointments={data.appointments}
                    isNeutral={data.isNeutral}
                />
            </div>
        </main>
    );
}
