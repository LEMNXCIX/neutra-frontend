"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, Gift, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LoyaltyConfigForm } from "@/components/admin/loyalty/LoyaltyConfigForm";
import {
    loyaltyService,
    type LoyaltyConfig,
    type LoyaltyTenantOverview,
} from "@/services/loyalty.service";

export function SuperAdminLoyaltyClient() {
    const [tenants, setTenants] = useState<LoyaltyTenantOverview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedTenantId, setSelectedTenantId] = useState("");
    const [config, setConfig] = useState<LoyaltyConfig | null>(null);
    const [isConfigLoading, setIsConfigLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const selectedTenantIdRef = useRef("");

    const loadTenants = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            setTenants(await loyaltyService.getAdminTenants());
        } catch {
            setLoadError("No pudimos cargar la información de fidelización.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTenants();
    }, [loadTenants]);

    const loadTenantConfig = useCallback(async (tenantId: string) => {
        if (!tenantId) return;

        selectedTenantIdRef.current = tenantId;
        setIsConfigLoading(true);
        setConfigError(null);
        setSuccess(null);
        setConfig(null);
        try {
            const nextConfig = await loyaltyService.getTenantConfig(tenantId);
            if (selectedTenantIdRef.current === tenantId) {
                setConfig(nextConfig);
            }
        } catch {
            if (selectedTenantIdRef.current === tenantId) {
                setConfigError("No pudimos cargar la configuración de esta organización.");
            }
        } finally {
            if (selectedTenantIdRef.current === tenantId) {
                setIsConfigLoading(false);
            }
        }
    }, []);

    const selectTenant = (tenantId: string) => {
        if (!tenantId) {
            selectedTenantIdRef.current = "";
            setConfig(null);
            setConfigError(null);
            setSuccess(null);
            setIsConfigLoading(false);
        }
        setSelectedTenantId(tenantId);
        if (tenantId) void loadTenantConfig(tenantId);
    };

    const saveConfig = async (nextConfig: LoyaltyConfig) => {
        if (!selectedTenantId) return;

        setIsSaving(true);
        setConfigError(null);
        setSuccess(null);
        try {
            const savedConfig = await loyaltyService.updateTenantConfig(
                selectedTenantId,
                nextConfig,
            );
            setConfig(savedConfig);
            setTenants((current) =>
                current.map((tenant) =>
                    tenant.tenantId === selectedTenantId
                        ? { ...tenant, config: savedConfig }
                        : tenant,
                ),
            );
            setSuccess("Configuración guardada correctamente.");
        } catch {
            setConfigError("No pudimos guardar la configuración.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                    <Gift className="size-7 text-primary" aria-hidden="true" />
                    Fidelización global
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Consulta todas las organizaciones y configura sus recompensas.
                </p>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent>
                        <p role="status" className="text-sm text-muted-foreground">
                            Cargando las organizaciones…
                        </p>
                    </CardContent>
                </Card>
            ) : loadError ? (
                <Card>
                    <CardContent className="space-y-4">
                        <p role="alert" className="text-sm text-destructive">
                            {loadError}
                        </p>
                        <Button variant="outline" onClick={loadTenants}>
                            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                            Reintentar
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Organizaciones</CardTitle>
                            <CardDescription>
                                El estado se muestra para todas las organizaciones, sin aplicar
                                filtros de funciones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tenants.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No hay organizaciones para mostrar.
                                </p>
                            ) : (
                                <div role="list" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {tenants.map((tenant) => (
                                        <Card key={tenant.tenantId} role="listitem">
                                            <CardContent className="space-y-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="flex items-center gap-2 font-semibold">
                                                            <Building2 className="size-4" aria-hidden="true" />
                                                            {tenant.name}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {tenant.slug} · {tenant.type}
                                                        </p>
                                                    </div>
                                                    <Badge variant={tenant.active ? "default" : "secondary"}>
                                                        {tenant.active ? "Activo" : "Inactivo"}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                    <div>
                                                        <p className="text-lg font-bold">
                                                            {tenant.stats.totalPoints.toLocaleString("es")}
                                                        </p>
                                                        <p className="text-muted-foreground">Puntos</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold">
                                                            {tenant.stats.totalClaims.toLocaleString("es")}
                                                        </p>
                                                        <p className="text-muted-foreground">Premios</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold">
                                                            {tenant.stats.activeCustomers.toLocaleString("es")}
                                                        </p>
                                                        <p className="text-muted-foreground">Clientes</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración por organización</CardTitle>
                            <CardDescription>
                                Selecciona una organización para cargar y guardar su configuración.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="loyalty-tenant" className="text-sm font-medium">
                                    Organización
                                </label>
                                <select
                                    id="loyalty-tenant"
                                    value={selectedTenantId}
                                    onChange={(event) => selectTenant(event.target.value)}
                                    disabled={isLoading}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 md:max-w-md"
                                >
                                    <option value="">Selecciona una organización</option>
                                    {tenants.map((tenant) => (
                                        <option key={tenant.tenantId} value={tenant.tenantId}>
                                            {tenant.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {isConfigLoading ? (
                                <p role="status" className="text-sm text-muted-foreground">
                                    Cargando la configuración…
                                </p>
                            ) : configError && !config ? (
                                <div role="alert" className="space-y-3">
                                    <p className="text-sm text-destructive">{configError}</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => void loadTenantConfig(selectedTenantId)}
                                    >
                                        <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                                        Reintentar
                                    </Button>
                                </div>
                            ) : config ? (
                                <LoyaltyConfigForm
                                    value={config}
                                    onChange={setConfig}
                                    onSave={saveConfig}
                                    isSaving={isSaving}
                                    error={configError}
                                    success={success}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Todavía no has seleccionado una organización.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
