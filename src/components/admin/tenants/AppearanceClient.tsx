"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BrandingEditor } from "./BrandingEditor";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { useTenantStore } from "@/store/tenant-store";
import { tenantService } from "@/services/tenant.service";
import type { Tenant, TenantBranding } from "@/types/tenant";
import { toast } from "sonner";
import { Palette } from "lucide-react";

export function AppearanceClient() {
    const { tenantId } = useTenantStore();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [branding, setBranding] = useState<TenantBranding>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadTenant = useCallback(async () => {
        if (!tenantId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await tenantService.getAll();
            const list = Array.isArray(data) ? data : [];
            const current = list.find((t) => t.id === tenantId) ?? null;
            setTenant(current);
            setBranding(current?.config?.branding ?? {});
        } catch {
            toast.error("Error al cargar la configuración del tenant");
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        loadTenant();
    }, [loadTenant]);

    const handleSave = async () => {
        if (!tenant) return;
        setSaving(true);
        try {
            await tenantService.update(tenant.id, {
                config: {
                    ...tenant.config,
                    branding,
                },
            });
            toast.success("Apariencia guardada");
        } catch {
            toast.error("Error al guardar la apariencia");
        } finally {
            setSaving(false);
        }
    };

    if (!tenantId) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <Palette className="size-10 text-muted-foreground" />
                <p className="font-semibold">No tenant context</p>
                <p className="text-sm text-muted-foreground">
                    Appearance can only be edited from a tenant admin.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="py-20 text-center text-sm text-muted-foreground">
                Tenant not found.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Appearance
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Customize colors, fonts and assets for{" "}
                        <span className="font-medium">{tenant.name}</span>
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Spinner className="mr-2 size-4" /> Saving…
                        </>
                    ) : (
                        "Guardar cambios"
                    )}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>
                        Changes are previewed live and applied after saving.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BrandingEditor
                        value={branding}
                        onChange={setBranding}
                        livePreview
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Spinner className="mr-2 size-4" /> Saving…
                        </>
                    ) : (
                        "Guardar cambios"
                    )}
                </Button>
            </div>
        </div>
    );
}
