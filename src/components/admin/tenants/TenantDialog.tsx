
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Tenant, CreateTenantData, TenantType, TenantConfig } from "@/types/tenant";
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
        config: {}
    });

    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name,
                slug: tenant.slug,
                type: tenant.type,
                config: tenant.config || {}
            });
        } else {
            setFormData({
                name: "",
                slug: "",
                type: TenantType.STORE,
                config: {}
            });
            setActiveTab("general");
        }
    }, [tenant, open]);

    const updateConfig = (section: 'branding' | 'settings', key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            config: {
                ...prev.config,
                [section]: {
                    ...prev.config?.[section],
                    [key]: value
                }
            }
        }));
    };

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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{tenant ? "Edit Tenant" : "Create Tenant"}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="branding">Branding</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    const slug = !tenant && !formData.slug
                                        ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                                        : formData.slug;
                                    setFormData(prev => ({ ...prev, name, slug }));
                                }}
                                placeholder="My Awesome Store"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug (Subdomain)</Label>
                            <Input
                                value={formData.slug}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="my-store"
                            />
                            <p className="text-xs text-muted-foreground">Will be accessed at {formData.slug}.xcix.ec</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, type: val as TenantType }))}
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
                    </TabsContent>

                    <TabsContent value="branding" className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1 cursor-pointer"
                                    value={formData.config?.branding?.primaryColor || "#000000"}
                                    onChange={(e) => updateConfig('branding', 'primaryColor', e.target.value)}
                                />
                                <Input
                                    value={formData.config?.branding?.primaryColor || ""}
                                    onChange={(e) => updateConfig('branding', 'primaryColor', e.target.value)}
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Logo URL</Label>
                            <Input
                                value={formData.config?.branding?.tenantLogo || ""}
                                onChange={(e) => updateConfig('branding', 'tenantLogo', e.target.value)}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Favicon URL</Label>
                            <Input
                                value={formData.config?.branding?.favicon || ""}
                                onChange={(e) => updateConfig('branding', 'favicon', e.target.value)}
                                placeholder="https://example.com/favicon.ico"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <Input
                                    value={formData.config?.settings?.supportEmail || ""}
                                    onChange={(e) => updateConfig('settings', 'supportEmail', e.target.value)}
                                    placeholder="support@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Website URL</Label>
                                <Input
                                    value={formData.config?.settings?.websiteUrl || ""}
                                    onChange={(e) => updateConfig('settings', 'websiteUrl', e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select
                                    value={formData.config?.settings?.currency || "USD"}
                                    onValueChange={(val) => updateConfig('settings', 'currency', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Language</Label>
                                <Select
                                    value={formData.config?.settings?.language || "es"}
                                    onValueChange={(val) => updateConfig('settings', 'language', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="es">Español</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Timezone</Label>
                                <Select
                                    value={formData.config?.settings?.timezone || "America/Guayaquil"}
                                    onValueChange={(val) => updateConfig('settings', 'timezone', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="America/Guayaquil">America/Guayaquil (GMT-5)</SelectItem>
                                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                                        <SelectItem value="Europe/Madrid">Europe/Madrid (CET)</SelectItem>
                                        <SelectItem value="UTC">UTC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

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
