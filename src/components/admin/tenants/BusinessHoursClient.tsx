"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import type { Tenant } from "@/types/tenant";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import {
    DEFAULT_WORKING_HOURS,
    HolidaysEditor,
    WorkingHoursEditor,
    normalizeWorkingHours,
    type WorkingHours,
} from "@/components/admin/booking/working-hours-editor";

export function BusinessHoursClient() {
    const { tenantId } = useTenantStore();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [businessHours, setBusinessHours] = useState<WorkingHours>(
        DEFAULT_WORKING_HOURS,
    );
    const [holidays, setHolidays] = useState<string[]>([]);
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
            setBusinessHours(
                normalizeWorkingHours(
                    current?.config?.settings?.businessHours ??
                        DEFAULT_WORKING_HOURS,
                ),
            );
            setHolidays(current?.config?.settings?.holidays ?? []);
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
                    settings: {
                        ...tenant.config?.settings,
                        businessHours,
                        holidays,
                    },
                },
            });
            toast.success("Horario guardado");
        } catch {
            toast.error("Error al guardar el horario");
        } finally {
            setSaving(false);
        }
    };

    if (!tenantId) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <Clock className="size-10 text-muted-foreground" />
                <p className="font-semibold">Sin contexto de tenant</p>
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
                        Horario del local
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Limita la disponibilidad de todos los miembros del
                        staff.
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
                    <CardTitle>Business Hours</CardTitle>
                    <CardDescription>
                        Los slots de reserva se generan en la intersección de
                        este horario con el del staff asignado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <WorkingHoursEditor
                        value={businessHours}
                        onChange={setBusinessHours}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Feriados</CardTitle>
                    <CardDescription>
                        Días con reservas cerradas (fechas puntuales).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HolidaysEditor value={holidays} onChange={setHolidays} />
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
