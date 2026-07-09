import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppointmentsClient } from "@/components/booking/appointments-client";
import { authService } from "@/services/auth.service";
import { api } from '@/lib/api-client';
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Appointments",
    description: "View and manage your appointments",
};

export const dynamic = "force-dynamic";

async function getInitialData() {
    try {
        const authRes = await authService.validate();
        const user = authRes?.user;
        if (!user) return null;

        const isStaff = user.role?.name === "STAFF";

        const requests: Promise<any>[] = [
            api.get<any[]>(`/appointments?userId=${user.id}`).catch(() => []),
        ];

        if (isStaff) {
            requests.push(api.get<any>('/staff/me').catch(() => null));
        }

        const results = await Promise.all(requests);

        const userAppointments = Array.isArray(results[0]) ? results[0] : [];
        let staffProfile = null;
        let staffAppointments: any[] = [];

        if (isStaff && results[1]) {
            staffProfile = results[1];
            if (staffProfile?.id) {
                staffAppointments = await api.get<any[]>(`/appointments?staffId=${staffProfile.id}`).catch(() => []) || [];
            }
        }

        return { user, userAppointments, staffProfile, staffAppointments, isStaff };
    } catch (error) {
        console.error("Error fetching initial appointments data:", error);
        return null;
    }
}

export default async function AppointmentsPage(props: {
    searchParams: Promise<{ success?: string }>;
}) {
    const [data, searchParams] = await Promise.all([
        getInitialData(),
        props.searchParams,
    ]);

    if (!data) {
        redirect("/login?redirect=/appointments");
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                        My <span className="text-primary">Appointments</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {data.isStaff
                            ? "Manage your schedule and bookings"
                            : "Manage your upcoming and past appointments"}
                    </p>
                </div>

                <AppointmentsClient
                    initialUserAppointments={data.userAppointments}
                    initialStaffAppointments={data.staffAppointments}
                    staffProfile={data.staffProfile}
                    isStaff={data.isStaff}
                    success={searchParams.success}
                />
            </div>
        </div>
    );
}
