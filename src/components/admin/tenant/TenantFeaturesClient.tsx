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
import { tenantService } from "@/services/tenant.service";
import { TenantFeatures, Tenant } from "@/types/tenant";
import { useTenant } from "@/context/tenant-context";

interface TenantFeaturesClientProps {
    activeTenantId?: string;
}

export default function TenantFeaturesClient({ activeTenantId }: TenantFeaturesClientProps) {
    const { tenantId: contextTenantId } = useTenant();
    // Use prop if provided, otherwise context, otherwise null
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(activeTenantId || contextTenantId);
    const [tenants, setTenants] = useState<Tenant[]>([]);

    const [loadingFeatures, setLoadingFeatures] = useState(false);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dynamic features list from backend
    const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);

    // Feature toggle state (key -> boolean)
    const [featureState, setFeatureState] = useState<Record<string, boolean>>({});

    // Load available features details on mount
    useEffect(() => {
        loadAvailableFeatures();
    }, []);

    // Load tenants if no context tenant ID AND no active prop (Super Admin view)
    useEffect(() => {
        if (!contextTenantId && !activeTenantId) {
            loadTenants();
        } else {
            setSelectedTenantId(activeTenantId || contextTenantId);
        }
    }, [contextTenantId, activeTenantId]);

    // Load features when selected tenant changes
    useEffect(() => {
        if (selectedTenantId) {
            loadTenantFeatures(selectedTenantId);
        }
    }, [selectedTenantId]);

    const loadAvailableFeatures = async () => {
        try {
            const features = await tenantService.getAvailableFeatures();
            setAvailableFeatures(features);
        } catch (error) {
            console.error("Failed to load available features definitions", error);
        }
    };

    const loadTenants = async () => {
        try {
            setLoadingTenants(true);
            const response = await tenantService.getAll();
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

    const loadTenantFeatures = async (id: string) => {
        try {
            setLoadingFeatures(true);
            const data = await tenantService.getFeatures(id);
            // Data is object { featureKey: boolean, ... }
            setFeatureState(data || {});
        } catch (error: any) {
            const msg = error?.message || "Unknown error";
            toast.error(`Failed to load features: ${msg}`);
        } finally {
            setLoadingFeatures(false);
        }
    };

    const handleToggle = (key: string) => {
        setFeatureState(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        if (!selectedTenantId) return;
        try {
            setSaving(true);
            await tenantService.updateFeatures(selectedTenantId, featureState);
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

    // Group features by category (optional, for better UI if categories exist)
    // fallback to a single list if no category

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
            {!contextTenantId && !activeTenantId && (
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
                    availableFeatures.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No features definition found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        Available Features
                                    </CardTitle>
                                    <CardDescription>
                                        Enable or disable platform capabilities
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {availableFeatures.map((feature: any) => (
                                        <div key={feature.key || feature.id} className="flex items-center justify-between space-x-2 border-b last:border-0 pb-4 last:pb-0">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-base">{feature.name}</Label>
                                                    {feature.price > 0 && (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                                            ${feature.price}
                                                        </span>
                                                    )}
                                                    {feature.price === 0 && (
                                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full font-medium">
                                                            Free
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {feature.description || "No description available"}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={featureState[feature.key] ?? false}
                                                onCheckedChange={() => handleToggle(feature.key)}
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )
                )
            ) : (
                !contextTenantId && !activeTenantId && (
                    <div className="flex justify-center items-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
                        Please select a tenant to configure features
                    </div>
                )
            )}
        </div>
    );
}
