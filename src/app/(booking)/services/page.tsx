import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ServicesGrid } from '@/components/booking/services-grid';
import type { Metadata } from "next";
import { api } from '@/lib/api-client';

export const metadata: Metadata = {
  title: "Services",
  description: "Browse available booking services",
};

export const dynamic = 'force-dynamic';

async function getServices() {
    try {
        return await api.get<any[]>('/services?activeOnly=true') || [];
    } catch (err) {
        console.error('Error loading services on server:', err);
        return [];
    }
}

export default async function ServicesPage() {
    const services = await getServices();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <Badge variant="outline" className="mb-4">Professional Services</Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                        Our <span className="text-primary">Services</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose from our range of professional services tailored to your needs
                    </p>
                </div>

                {/* Services Grid (Client Component for interactivity) */}
                <ServicesGrid services={services} />
            </div>
        </div>
    );
}
