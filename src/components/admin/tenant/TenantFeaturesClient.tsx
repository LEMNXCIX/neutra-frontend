"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Save, Settings, Building } from "lucide-react";
import { tenantService } from "@/services";
import { TenantFeatures, Tenant } from "@/types/tenant";
import { useTenant } from "@/context/tenant-context";

export default function TenantFeaturesClient() {
    const { tenantId: contextTenantId } = useTenant();
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(contextTenantId);
    const [tenants, setTenants] = useState<Tenant[]>([]);

    const [loadingFeatures, setLoadingFeatures] = useState(false);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [saving, setSaving] = useState(false);

    const [features, setFeatures] = useState<TenantFeatures>({
        coupons: false,
        appointmentCoupons: false,
    });

    // Load tenants if no context tenant ID (Super Admin view)
    useEffect(() => {
        if (!contextTenantId) {
            loadTenants();
        } else {
            setSelectedTenantId(contextTenantId);
        }
    }, [contextTenantId]);

    // Load features when selected tenant changes
    useEffect(() => {
        if (selectedTenantId) {
            loadFeatures(selectedTenantId);
        }
    }, [selectedTenantId]);

    const loadTenants = async () => {
        try {
            setLoadingTenants(true);
            const response = await tenantService.getAll();
            // API response might be array or { data: array } depending on implementation
            // Checking service implementation: return api.get<Tenant[]>('/tenants'); 
            // Usually returns data directly if interceptor handles it, or AxiosResponse.
            // Assuming the service returns the data directly based on other usage.
            // However, standard API wrapper usually returns { data: ... } or just data.
            // Let's assume it returns data or check if it needs .data
            const data = response as any;
            const tenantsList = Array.isArray(data) ? data : (data.data || []);
            setTenants(tenantsList);
        } catch (error) {
            console.error("Failed to load tenants", error);
            toast.error("Failed to load tenants list");
        } finally {
            setLoadingTenants(false);
        }
    };

    const loadFeatures = async (id: string) => {
        console.log(`Loading features for tenant: ${id}`);
        try {
            setLoadingFeatures(true);
            const data = await tenantService.getFeatures(id);
            console.log('Features loaded:', data);
            setFeatures({
                coupons: data.coupons ?? false,
                appointmentCoupons: data.appointmentCoupons ?? false,
            });
        } catch (error: any) {
            console.error("Failed to load features", error);
            const msg = error?.message || "Unknown error";
            toast.error(`Failed to load features: ${msg}`);
        } finally {
            setLoadingFeatures(false);
        }
    };

    const handleToggle = (key: keyof TenantFeatures) => {
        setFeatures(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        if (!selectedTenantId) return;
        try {
            setSaving(true);
            await tenantService.updateFeatures(selectedTenantId, features);
            toast.success("Features configuration saved");
        } catch (error) {
            console.error("Failed to save features", error);
            toast.error("Failed to save features");
        } finally {
            setSaving(false);
        }
    };

    if (loadingTenants) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Feature Configuration</h1>
                    <p className="text-muted-foreground">Manage active features for your tenant</p>
                </div>
                {selectedTenantId && (
                    <Button onClick={handleSave} disabled={saving || loadingFeatures}>
                        {saving ? <><Spinner className="mr-2 h-4 w-4" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                )}
            </div>

            {/* Tenant Selector for Super Admin */}
            {!contextTenantId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Select Tenant
                        </CardTitle>
                        <CardDescription>
                            Choose a tenant to configure features
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedTenantId || ""}
                            onValueChange={setSelectedTenantId}
                        >
                            <SelectTrigger className="w-full md:w-[300px]">
                                <SelectValue placeholder="Select a tenant..." />
                            </SelectTrigger>
                            <SelectContent>
                                {tenants.map(tenant => (
                                    <SelectItem key={tenant.id} value={tenant.id}>
                                        {tenant.name} ({tenant.slug})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            {selectedTenantId ? (
                loadingFeatures ? (
                    <div className="flex justify-center items-center h-40">
                        <Spinner className="h-8 w-8" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    General Features
                                </CardTitle>
                                <CardDescription>
                                    Configure core platform features
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Banners</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable banner management for promotions
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features.banners}
                                        onCheckedChange={() => handleToggle('banners')}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Orders System</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable order processing and management
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features.orders}
                                        onCheckedChange={() => handleToggle('orders')}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Marketing & Coupons
                                </CardTitle>
                                <CardDescription>
                                    Configure marketing and loyalty features
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Coupons System</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable the core coupons functionality
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features.coupons}
                                        onCheckedChange={() => handleToggle('coupons')}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Appointment Coupons</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow customers to apply coupons during appointment booking
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features.appointmentCoupons}
                                        onCheckedChange={() => handleToggle('appointmentCoupons')}
                                        disabled={!features.coupons}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            ) : (
                !contextTenantId && (
                    <div className="flex justify-center items-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
                        Please select a tenant to configure features
                    </div>
                )
            )}
        </div>
    );
}
