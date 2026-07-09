import React from "react";
import { FeaturesTable } from "@/components/admin/features/FeaturesTable";
import { api } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

async function getFeatures() {
    try {
        return await api.get<any[]>('/features');
    } catch (error) {
        console.error("Error fetching features on server:", error);
        return [];
    }
}

export default async function FeaturesPage() {
    const features = await getFeatures();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Features</h1>
                <p className="text-muted-foreground">
                    Manage and price the features available across all tenants.
                </p>
            </div>

            <FeaturesTable initialFeatures={features} />
        </div>
    );
}
