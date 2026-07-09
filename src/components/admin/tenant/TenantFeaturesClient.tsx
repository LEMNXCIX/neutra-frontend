"use client";

import React, { useReducer, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import { useTenantStore } from "@/store/tenant-store";

type TenantFeaturesState = {
  selectedTenantId: string | null;
  tenants: Tenant[];
  loadingFeatures: boolean;
  loadingTenants: boolean;
  saving: boolean;
  availableFeatures: any[];
  featureState: Record<string, boolean>;
};

type TenantFeaturesAction =
  | { type: "SET_SELECTED_TENANT_ID"; payload: string | null }
  | { type: "SET_TENANTS"; payload: Tenant[] }
  | { type: "SET_LOADING_FEATURES"; payload: boolean }
  | { type: "SET_LOADING_TENANTS"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_AVAILABLE_FEATURES"; payload: any[] }
  | { type: "SET_FEATURE_STATE"; payload: Record<string, boolean> };

function tenantFeaturesReducer(state: TenantFeaturesState, action: TenantFeaturesAction): TenantFeaturesState {
  switch (action.type) {
    case "SET_SELECTED_TENANT_ID":
      return { ...state, selectedTenantId: action.payload };
    case "SET_TENANTS":
      return { ...state, tenants: action.payload };
    case "SET_LOADING_FEATURES":
      return { ...state, loadingFeatures: action.payload };
    case "SET_LOADING_TENANTS":
      return { ...state, loadingTenants: action.payload };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "SET_AVAILABLE_FEATURES":
      return { ...state, availableFeatures: action.payload };
    case "SET_FEATURE_STATE":
      return { ...state, featureState: action.payload };
    default:
      return state;
  }
}

interface TenantFeaturesClientProps {
  activeTenantId?: string;
}

export default function TenantFeaturesClient({
    activeTenantId,
}: TenantFeaturesClientProps) {
    const { tenantId: contextTenantId } = useTenantStore();
    const effectiveTenantId = activeTenantId || contextTenantId;
    const isSuperAdminView = !effectiveTenantId;
  const [state, dispatch] = useReducer(tenantFeaturesReducer, {
    selectedTenantId: null,
    tenants: [],
    loadingFeatures: false,
    loadingTenants: false,
    saving: false,
    availableFeatures: [],
    featureState: {},
  });
  const { selectedTenantId, tenants, loadingFeatures, loadingTenants, saving, availableFeatures, featureState } = state;
  const setFeatureState = (updater: any) => { const next = typeof updater === 'function' ? updater(featureState) : updater; dispatch({ type: "SET_FEATURE_STATE", payload: next }); };

  const loadAvailableFeatures = useCallback(async () => {
    try {
      const features = await tenantService.getAvailableFeatures();
      dispatch({ type: "SET_AVAILABLE_FEATURES", payload: features });
    } catch (error) {
      console.error(
        "Failed to load available features definitions",
        error,
      );
    }
  }, []);

  const loadTenants = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING_TENANTS", payload: true });
      const response = await tenantService.getAll();
      const data = response as any;
      const tenantsList = Array.isArray(data) ? data : data.data || [];
      dispatch({ type: "SET_TENANTS", payload: tenantsList });
    } catch (error) {
      console.error("Failed to load tenants", error);
      toast.error("Failed to load tenants list");
    } finally {
      dispatch({ type: "SET_LOADING_TENANTS", payload: false });
    }
  }, []);

  const loadTenantFeatures = useCallback(async (id: string) => {
    try {
      dispatch({ type: "SET_LOADING_FEATURES", payload: true });
      const data = await tenantService.getFeatures(id);
      dispatch({ type: "SET_FEATURE_STATE", payload: data || {} });
    } catch (error: any) {
      const msg = error?.message || "Unknown error";
      toast.error(`Failed to load features: ${msg}`);
    } finally {
      dispatch({ type: "SET_LOADING_FEATURES", payload: false });
    }
  }, []);

  useEffect(() => {
    loadAvailableFeatures();
  }, [loadAvailableFeatures]);

  useEffect(() => {
    if (isSuperAdminView) {
      loadTenants();
    }
  }, [isSuperAdminView, loadTenants]);

  useEffect(() => {
    if (effectiveTenantId) {
      loadTenantFeatures(effectiveTenantId);
    }
  }, [effectiveTenantId, loadTenantFeatures]);

  const handleTenantSelect = (id: string) => {
    dispatch({ type: "SET_SELECTED_TENANT_ID", payload: id });
    loadTenantFeatures(id);
  };

  const handleToggle = (key: string) => {
    setFeatureState((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

    const activeId = effectiveTenantId || selectedTenantId;

  const handleSave = async () => {
        if (!activeId) return;
        try {
      dispatch({ type: "SET_SAVING", payload: true });
      await tenantService.updateFeatures(activeId, featureState);
            toast.success("Features configuration saved");
        } catch (error) {
            console.error("Failed to save features", error);
            toast.error("Failed to save features");
        } finally {
            dispatch({ type: "SET_SAVING", payload: false });
        }
    };

    if (loadingTenants) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner className="size-8" />
            </div>
        );
    }

    // Group features by category (optional, for better UI if categories exist)
    // fallback to a single list if no category

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Feature Configuration
                    </h1>
                    <p className="text-muted-foreground">
                        Manage active features for your tenant
                    </p>
                </div>
                {activeId && (
                    <Button
                        onClick={handleSave}
                        disabled={saving || loadingFeatures}
                    >
                        {saving ? (
                            <>
                                <Spinner className="mr-2 size-4" /> Saving…
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 size-4" /> Save Changes
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Tenant Selector for Super Admin */}
            {!effectiveTenantId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="size-5" />
                            Select Tenant
                        </CardTitle>
                        <CardDescription>
                            Choose a tenant to configure features
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedTenantId || ""}
                            onValueChange={handleTenantSelect}
                        >
                            <SelectTrigger className="w-full md:w-[300px]">
                                <SelectValue placeholder="Select a tenant..." />
                            </SelectTrigger>
                            <SelectContent>
                                {tenants.map((tenant) => (
                                    <SelectItem
                                        key={tenant.id}
                                        value={tenant.id}
                                    >
                                        {tenant.name} ({tenant.slug})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            {activeId ? (
                loadingFeatures ? (
                    <div className="flex justify-center items-center h-40">
                        <Spinner className="size-8" />
                    </div>
                ) : availableFeatures.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No features definition found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="size-5" />
                                    Available Features
                                </CardTitle>
                                <CardDescription>
                                    Enable or disable platform capabilities
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {availableFeatures.map((feature: any) => (
                                    <div
                                        key={feature.key || feature.id}
                                        className="flex items-center justify-between gap-2 border-b last:border-0 pb-4 last:pb-0"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-base">
                                                    {feature.name}
                                                </Label>
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
                                                {feature.description ||
                                                    "No description available"}
                                            </p>
                                        </div>
                                        <Switch
                  checked={
                    featureState[feature.key] ??
                    false
                  }
                                            onCheckedChange={() =>
                                                handleToggle(feature.key)
                                            }
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )
            ) : (
                !contextTenantId &&
                !activeTenantId && (
                    <div className="flex justify-center items-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
                        Please select a tenant to configure features
                    </div>
                )
            )}
        </div>
    );
}
