"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Gift, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from "@/components/ui/card";
import {
    loyaltyService,
    type LoyaltyCampaignStatus,
    type LoyaltyTenantOverview,
} from "@/services/loyalty.service";

const STATUS_COPY: Record<
    LoyaltyCampaignStatus,
    { label: string; variant: "default" | "secondary" | "outline" }
> = {
    DRAFT: { label: "Borrador", variant: "secondary" },
    ACTIVE: { label: "Activa", variant: "default" },
    ENDED: { label: "Finalizada", variant: "outline" },
    ARCHIVED: { label: "Archivada", variant: "secondary" },
};

export function SuperAdminLoyaltyClient() {
    const [tenants, setTenants] = useState<LoyaltyTenantOverview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                    <Gift className="size-7 text-primary" aria-hidden="true" />
                    Fidelización global
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Consulta las campañas de todas las organizaciones sin modificar su configuración.
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
            ) : tenants.length === 0 ? (
                <Card>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            No hay organizaciones para mostrar.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div role="list" className="space-y-6">
                    {tenants.map((tenant) => (
                        <Card key={tenant.tenantId} role="listitem">
                            <CardHeader>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xl font-semibold">
                                            <Building2 className="size-5" aria-hidden="true" />
                                            {tenant.name}
                                        </h3>
                                        <CardDescription>
                                            {tenant.slug} · {tenant.type}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={tenant.active ? "default" : "secondary"}>
                                        {tenant.active ? "Activa" : "Inactiva"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
                                    {[
                                        ["Campañas", tenant.stats.campaignCount],
                                        ["Activas", tenant.stats.activeCampaignCount],
                                        ["Finalizadas", tenant.stats.endedCampaignCount],
                                        ["Archivadas", tenant.stats.archivedCampaignCount],
                                        ["Reclamos", tenant.stats.totalClaims],
                                    ].map(([label, value]) => (
                                        <div key={String(label)} className="rounded-md bg-muted/30 p-3">
                                            <p className="text-xl font-bold">
                                                {Number(value).toLocaleString("es")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {tenant.campaigns.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Esta organización no tiene campañas.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {tenant.campaigns.map((campaign) => {
                                            const status = STATUS_COPY[campaign.status];
                                            return (
                                                <div
                                                    key={campaign.id}
                                                    className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3"
                                                >
                                                    <div>
                                                        <h4 className="font-medium">{campaign.name}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {campaign.metric === "COUNT"
                                                                ? `${campaign.targetValue} completados`
                                                                : `${campaign.targetValue} de gasto`}
                                                            {" · "}
                                                            {campaign.source}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">
                                                            {campaign.claimedCount} reclamos
                                                        </span>
                                                        <Badge variant={status.variant}>
                                                            {status.label}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
