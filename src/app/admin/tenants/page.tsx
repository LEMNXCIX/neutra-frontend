"use client";

import React from "react";
import { TenantsTable } from "@/components/admin/tenants/TenantsTable";

export default function TenantsPage() {
    return (
        <div className="space-y-6">
            <TenantsTable />
        </div>
    );
}

