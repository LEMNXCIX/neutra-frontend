import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ServicesGrid } from '@/components/booking/services-grid';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getServices() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
        
        // Get tenant info from cookies
        const cookieStore = await cookies();
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';
        const tenantId = cookieStore.get('tenant-id')?.value || '';

        const response = await fetch(`${baseUrl}/services?activeOnly=true`, {
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-slug': tenantSlug,
                'x-tenant-id': tenantId,
            },
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!response.ok) {
            console.error('Failed to fetch services:', response.status);
            return [];
        }

        const result = await response.json();
        return result.data || [];
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
