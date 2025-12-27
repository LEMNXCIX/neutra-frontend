
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Tenant, CreateTenantData, TenantType } from "@/types/tenant";
import { tenantService } from "@/services/tenant.service";
import { featuresService, PlatformFeature } from "@/services/features.service";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { Checkbox } from "@/components/ui/checkbox";

interface TenantFormProps {
    tenant?: Tenant | null;
    onSuccess: () => void;
    onCancel?: () => void;
    submitLabel?: string;
    isWizard?: boolean;
}

export function TenantForm({ tenant, onSuccess, onCancel, submitLabel, isWizard }: TenantFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [platformFeatures, setPlatformFeatures] = useState<PlatformFeature[]>([]);
    const [formData, setFormData] = useState<CreateTenantData>({
        name: "",
        slug: "",
        type: TenantType.STORE,
        config: {
            features: {}
        }
    });

    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        const loadFeatures = async () => {
            try {
                const data = await featuresService.getAll();
                setPlatformFeatures(data);
            } catch (err) {
                console.error("Failed to load features", err);
            }
        };
        loadFeatures();
    }, []);

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name,
                slug: tenant.slug,
                type: tenant.type,
                config: tenant.config || { features: {} }
            });
        } else {
            setFormData({
                name: "",
                slug: "",
                type: TenantType.STORE,
                config: { features: {} }
            });
            setActiveTab("general");
        }
    }, [tenant]);

    const updateConfig = (section: 'branding' | 'settings' | 'features', key: string, value: any) => {
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

    const toggleFeature = (key: string) => {
        const currentFeatures = formData.config?.features || {};
        updateConfig('features', key, !currentFeatures[key]);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
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
                toast.success("Tenant created successfully!");
            }
            onSuccess();
        } catch (err: any) {
            const message = err instanceof ApiError ? err.message : "Failed to save tenant";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${isWizard ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    {isWizard && <TabsTrigger value="features">Features</TabsTrigger>}
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
                            className="h-12 border-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug (Subdomain)</Label>
                        <Input
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            placeholder="my-store"
                            className="h-12 border-2"
                        />
                        <p className="text-xs text-muted-foreground">Will be accessed at {formData.slug || 'your-slug'}.xcix.ec</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, type: val as TenantType }))}
                        >
                            <SelectTrigger className="h-12 border-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TenantType.STORE}>Store (E-commerce)</SelectItem>
                                <SelectItem value={TenantType.BOOKING}>Booking (Services)</SelectItem>
                                <SelectItem value={TenantType.HYBRID}>Hybrid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {isWizard && (
                        <div className="pt-4 flex justify-end">
                            <Button type="button" onClick={() => setActiveTab("branding")} className="font-bold">Next Step: Branding →</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="branding" className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                className="w-12 h-12 p-1 cursor-pointer border-2"
                                value={formData.config?.branding?.primaryColor || "#000000"}
                                onChange={(e) => updateConfig('branding', 'primaryColor', e.target.value)}
                            />
                            <Input
                                value={formData.config?.branding?.primaryColor || ""}
                                onChange={(e) => updateConfig('branding', 'primaryColor', e.target.value)}
                                placeholder="#000000"
                                className="h-12 border-2"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                            value={formData.config?.branding?.tenantLogo || ""}
                            onChange={(e) => updateConfig('branding', 'tenantLogo', e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="h-12 border-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Favicon URL</Label>
                        <Input
                            value={formData.config?.branding?.favicon || ""}
                            onChange={(e) => updateConfig('branding', 'favicon', e.target.value)}
                            placeholder="https://example.com/favicon.ico"
                            className="h-12 border-2"
                        />
                    </div>
                    {isWizard && (
                        <div className="pt-4 flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setActiveTab("general")}>← Back</Button>
                            <Button type="button" onClick={() => setActiveTab("settings")} className="font-bold">Next Step: Settings →</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="settings" className="py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Support Email</Label>
                            <Input
                                value={formData.config?.settings?.supportEmail || ""}
                                onChange={(e) => updateConfig('settings', 'supportEmail', e.target.value)}
                                placeholder="support@example.com"
                                className="h-12 border-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Website URL</Label>
                            <Input
                                value={formData.config?.settings?.websiteUrl || ""}
                                onChange={(e) => updateConfig('settings', 'websiteUrl', e.target.value)}
                                placeholder="https://example.com"
                                className="h-12 border-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select
                                value={formData.config?.settings?.currency || "USD"}
                                onValueChange={(val) => updateConfig('settings', 'currency', val)}
                            >
                                <SelectTrigger className="h-12 border-2">
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
                                <SelectTrigger className="h-12 border-2">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="es">Español</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {isWizard && (
                        <div className="pt-4 flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setActiveTab("branding")}>← Back</Button>
                            <Button type="button" onClick={() => setActiveTab("features")} className="font-bold">Next Step: Features →</Button>
                        </div>
                    )}
                </TabsContent>

                {isWizard && (
                    <TabsContent value="features" className="py-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {platformFeatures.map(feature => (
                                <div
                                    key={feature.id}
                                    className={`flex items-start gap-3 p-4 border-2 transition-all cursor-pointer hover:border-primary ${formData.config?.features?.[feature.key] ? 'border-primary bg-primary/5' : 'border-border'}`}
                                    onClick={() => toggleFeature(feature.key)}
                                >
                                    <Checkbox
                                        id={feature.id}
                                        checked={!!formData.config?.features?.[feature.key]}
                                        onCheckedChange={() => toggleFeature(feature.key)}
                                        className="mt-1"
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor={feature.id} className="font-bold cursor-pointer">{feature.name}</Label>
                                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                                        <p className="text-xs font-black text-primary">${feature.price}/mo</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setActiveTab("settings")}>← Back</Button>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isSaving} className="px-8 font-black uppercase tracking-widest shadow-lg">
                    {isSaving ? <><Spinner className="mr-2" /> Saving...</> : (submitLabel || (tenant ? "Update Tenant" : "Create My Store"))}
                </Button>
            </div>
        </form>
    );
}
