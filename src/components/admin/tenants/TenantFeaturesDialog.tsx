"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import TenantFeaturesClient from "@/components/admin/tenant/TenantFeaturesClient";

interface TenantFeaturesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantId: string;
    tenantName: string;
}

export function TenantFeaturesDialog({ open, onOpenChange, tenantId, tenantName }: TenantFeaturesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="mb-4">
                    <DialogTitle>Manage Features for {tenantName}</DialogTitle>
                    <DialogDescription>
                        Activa o desactiva las funcionalidades de este tenant. El precio se muestra para cada funcionalidad.
                    </DialogDescription>
                </DialogHeader>

                <TenantFeaturesClient activeTenantId={tenantId} />

            </DialogContent>
        </Dialog>
    );
}
