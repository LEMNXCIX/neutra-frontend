import React from "react";
import { FeaturesTable } from "@/components/admin/features/FeaturesTable";
import { getBackendUrl } from "@/lib/backend-api";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

async function getFeatures() {
    try {
        const baseUrl = getBackendUrl();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        const response = await fetch(`${baseUrl}/features`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Cookie': `token=${token}` }),
            },
            cache: 'no-store'
        });

        if (!response.ok) return [];
        const result = await response.json();
        return result.data || result || [];
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
