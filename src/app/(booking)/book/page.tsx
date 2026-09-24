import React from "react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { apiClient } from "@/lib/api-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reservar una Cita",
    description: "Agenda tu próxima cita en línea",
};

export const dynamic = "force-dynamic";

async function getData() {
    try {
        const [services, staff] = await Promise.all([
            apiClient<any[]>('/services?activeOnly=true'),
            apiClient<any[]>('/staff?activeOnly=true'),
        ]);

        return {
            services: services || [],
            staff: staff || [],
        };
    } catch (error) {
        console.error("Error fetching booking wizard data on server:", error);
        return { services: [], staff: [] };
    }
}

export default async function BookPage(props: {
    searchParams: Promise<{ serviceId?: string }>;
}) {
  const [searchParams, { services, staff }] = await Promise.all([
    props.searchParams,
    getData(),
  ]);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                        Reservar una{" "}
                        <span className="text-primary">cita</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Completá los pasos para programar tu cita
                    </p>
                </div>

                <BookingWizard
                    initialServices={services}
                    initialStaff={staff}
                    preSelectedServiceId={searchParams.serviceId}
                />
            </div>
        </div>
    );
}
