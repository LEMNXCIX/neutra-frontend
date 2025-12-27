
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tenant } from "@/types/tenant";
import { TenantForm } from "./TenantForm";

interface TenantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant?: Tenant | null;
    onSuccess: () => void;
}

export function TenantDialog({ open, onOpenChange, tenant, onSuccess }: TenantDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{tenant ? "Edit Tenant" : "Create Tenant"}</DialogTitle>
                </DialogHeader>

                <TenantForm
                    tenant={tenant}
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
