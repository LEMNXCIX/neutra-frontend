"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tenant } from "@/types/tenant";
import { TenantForm } from "./TenantForm";

const EMPTY_PLATFORM_FEATURES: any[] = [];

interface TenantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant?: Tenant | null;
    onSuccess: () => void;
    initialPlatformFeatures?: any[];
}

export function TenantDialog({
    open,
    onOpenChange,
    tenant,
    onSuccess,
    initialPlatformFeatures = EMPTY_PLATFORM_FEATURES,
}: TenantDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {tenant ? "Edit Tenant" : "Create Tenant"}
                    </DialogTitle>
                </DialogHeader>

                <TenantForm
                    key={tenant?.id ?? "new"}
                    tenant={tenant}
                    initialPlatformFeatures={initialPlatformFeatures}
                    onSuccess={() => {
                        onSuccess();
                        onOpenChange(false);
                    }}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
