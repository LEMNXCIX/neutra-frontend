"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { PlatformFeature, CreateFeatureData, featuresService } from "@/services/features.service";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { Zap, DollarSign } from "lucide-react";

interface FeatureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feature?: PlatformFeature | null;
    onSuccess: () => void;
}

export function FeatureDialog({ open, onOpenChange, feature, onSuccess }: FeatureDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<CreateFeatureData>({
        name: "",
        key: "",
        description: "",
        category: "General",
        price: 0
    });

    useEffect(() => {
        if (feature) {
            setFormData({
                name: feature.name,
                key: feature.key,
                description: feature.description || "",
                category: feature.category || "General",
                price: feature.price
            });
        } else {
            setFormData({
                name: "",
                key: "",
                description: "",
                category: "General",
                price: 0
            });
        }
    }, [feature, open]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.key) {
            toast.error("Name and Key are required");
            return;
        }

        setIsSaving(true);
        try {
            if (feature) {
                await featuresService.update(feature.id, formData);
                toast.success("Feature updated");
            } else {
                await featuresService.create(formData);
                toast.success("Feature created");
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            const message = err instanceof ApiError ? err.message : "Failed to save feature";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        {feature ? "Edit Feature" : "Create Feature"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    const key = !feature && !formData.key
                                        ? name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_')
                                        : formData.key;
                                    setFormData(prev => ({ ...prev, name, key }));
                                }}
                                placeholder="Advanced Analytics"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Key (Internal)</Label>
                            <Input
                                value={formData.key}
                                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
                                placeholder="ADVANCED_ANALYTICS"
                                disabled={!!feature}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Input
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g. Analytics, Marketing, Support"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Monthly Price</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                className="pl-9"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe what this feature enables..."
                            rows={3}
                        />
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
