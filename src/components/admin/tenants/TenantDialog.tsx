
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tenant, CreateTenantData, TenantType } from "@/types/tenant";
import { tenantService } from "@/services/tenant.service";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";

interface TenantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant?: Tenant | null;
    onSuccess: () => void;
}

export function TenantDialog({ open, onOpenChange, tenant, onSuccess }: TenantDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<CreateTenantData>({
        name: "",
        slug: "",
        type: TenantType.STORE,
    });

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name,
                slug: tenant.slug,
                type: tenant.type,
            });
        } else {
            setFormData({
                name: "",
                slug: "",
                type: TenantType.STORE,
            });
        }
    }, [tenant, open]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.slug) {
            toast.error("Name and Slug are required");
            return;
        }

        setIsSaving(true);
        try {
            if (tenant) {
                await tenantService.update(tenant.id, formData);
                toast.success("Tenant updated");
            } else {
                await tenantService.create(formData);
                toast.success("Tenant created");
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            const message = err instanceof ApiError ? err.message : "Failed to save tenant";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{tenant ? "Edit Tenant" : "Create Tenant"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                // Auto-generate slug if creating new
                                const slug = !tenant && !formData.slug
                                    ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                                    : formData.slug;
                                setFormData({ ...formData, name, slug });
                            }}
                            placeholder="My Awesome Store"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug (Subdomain)</Label>
                        <Input
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="my-store"
                        />
                        <p className="text-xs text-muted-foreground">Will be accessed at {formData.slug}.xcix.ec</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val as TenantType })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TenantType.STORE}>Store (E-commerce)</SelectItem>
                                <SelectItem value={TenantType.BOOKING}>Booking (Services)</SelectItem>
                                <SelectItem value={TenantType.HYBRID}>Hybrid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? <><Spinner className="mr-2" /> Saving...</> : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
