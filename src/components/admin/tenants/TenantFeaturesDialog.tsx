"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api-client";

interface Feature {
    id: string;
    name: string;
    description?: string;
    active: boolean;
}

interface TenantFeature {
    featureId: string;
    enabled: boolean;
}

interface TenantFeaturesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantId: string;
    tenantName: string;
}

export function TenantFeaturesDialog({ open, onOpenChange, tenantId, tenantName }: TenantFeaturesDialogProps) {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [tenantFeatures, setTenantFeatures] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open, tenantId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load all available features
            const allFeatures = await api.get<Feature[]>('/features');
            setFeatures(allFeatures);

            // Load tenant's current features
            const currentFeatures = await api.get<TenantFeature[]>(`/tenants/${tenantId}/features`);

            // Create a map of featureId -> enabled
            const featuresMap: Record<string, boolean> = {};
            currentFeatures.forEach(tf => {
                featuresMap[tf.featureId] = tf.enabled;
            });
            setTenantFeatures(featuresMap);
        } catch (error) {
            console.error('Error loading features:', error);
            toast.error('Failed to load features');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeature = (featureId: string) => {
        setTenantFeatures(prev => ({
            ...prev,
            [featureId]: !prev[featureId]
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Convert the map to an array of TenantFeature objects
            const featuresToUpdate = Object.entries(tenantFeatures).map(([featureId, enabled]) => ({
                featureId,
                enabled
            }));

            await api.put(`/tenants/${tenantId}/features`, featuresToUpdate);

            toast.success('Features updated successfully');
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving features:', error);
            toast.error('Failed to update features');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Features for {tenantName}</DialogTitle>
                    <DialogDescription>
                        Enable or disable features for this tenant. Changes will take effect immediately.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {features.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No features available. Create features first in the Features section.
                            </p>
                        ) : (
                            features.map((feature) => (
                                <div key={feature.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                    <Checkbox
                                        id={`feature-${feature.id}`}
                                        checked={tenantFeatures[feature.id] || false}
                                        onCheckedChange={() => handleToggleFeature(feature.id)}
                                        disabled={!feature.active}
                                    />
                                    <div className="flex-1">
                                        <Label
                                            htmlFor={`feature-${feature.id}`}
                                            className="font-medium cursor-pointer"
                                        >
                                            {feature.name}
                                            {!feature.active && (
                                                <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>
                                            )}
                                        </Label>
                                        {feature.description && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {feature.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
