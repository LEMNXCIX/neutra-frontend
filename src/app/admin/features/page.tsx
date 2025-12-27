"use client";

import React from "react";
import { FeaturesTable } from "@/components/admin/features/FeaturesTable";

export default function FeaturesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Features</h1>
                <p className="text-muted-foreground">
                    Manage and price the features available across all tenants.
                </p>
            </div>

            <FeaturesTable />
        </div>
    );
}
