"use client";

import React from 'react';
import { SidebarProvider } from "@/components/ui/new-sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (

        <div >
            {children}
        </div>

    );
}