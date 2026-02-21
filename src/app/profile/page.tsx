import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/profile-client";
import { authService } from "@/services/auth.service";
import { getBackendUrl } from "@/lib/backend-api";

export const dynamic = 'force-dynamic';

async function getData() {
    console.log("[ProfilePage] getData() triggered on server");
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';
        const moduleType = cookieStore.get('module-type')?.value || 'root';

        console.log(`[ProfilePage] token: ${token ? 'present' : 'missing'} | tenant: ${tenantSlug} | module: ${moduleType}`);

        if (!token) {
            console.log("[ProfilePage] No token found, redirecting to login");
            return null;
        }

        // 1. Validate session
        console.log("[ProfilePage] Validating session via authService.validate()...");
        const authRes = await authService.validate();
        console.log("[ProfilePage] authRes:", authRes ? 'success' : 'failed');
        
        const user = authRes?.user;
        if (!user) {
            console.log("[ProfilePage] No user found in authRes, returning null");
            return null;
        }

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
        <main className={`min-h-screen py-16 px-4 ${data.isNeutral ? 'bg-gradient-to-b from-background to-muted/20' : 'bg-background'}`}>
            <div className="max-w-6xl mx-auto space-y-12">
                <div className={data.isNeutral ? "text-center space-y-4" : "space-y-2"}>
                    <h1 className={`font-bold tracking-tight text-foreground ${data.isNeutral ? "text-5xl md:text-7xl" : "text-4xl"}`}>
                        {data.isNeutral ? "User Profile" : "Account Overview"}
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        {data.isNeutral ? "Manage your global security and preferences" : "Review your recent activity and account settings"}
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
