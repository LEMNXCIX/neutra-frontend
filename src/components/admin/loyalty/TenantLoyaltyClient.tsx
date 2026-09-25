"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Archive,
    CheckCircle2,
    Gift,
    Pencil,
    Plus,
    RefreshCw,
    Square,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LoyaltyCampaignForm } from "@/components/admin/loyalty/LoyaltyCampaignForm";
import { useFeatures } from "@/hooks/useFeatures";
import {
    loyaltyService,
    type CreateLoyaltyCampaignInput,
    type LoyaltyCampaign,
    type LoyaltyCampaignStatus,
    type LoyaltyTenantSummary,
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

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(
        new Date(value),
    );
}

export function TenantLoyaltyClient() {
    const { isFeatureEnabled } = useFeatures();
    const enabled =
        isFeatureEnabled("LOYALTY") && isFeatureEnabled("COUPONS");
    const [summary, setSummary] = useState<LoyaltyTenantSummary | null>(null);
    const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);
    const [editingCampaign, setEditingCampaign] =
        useState<LoyaltyCampaign | null>(null);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [nextSummary, nextCampaigns] = await Promise.all([
                loyaltyService.getAdminSummary(),
                loyaltyService.getAdminCampaigns(),
            ]);
            setSummary(nextSummary);
            setCampaigns(nextCampaigns);
            return true;
        } catch {
            setLoadError("No pudimos cargar las campañas de fidelización.");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enabled) void loadData();
    }, [enabled, loadData]);

    if (!enabled) return null;

    const saveCampaign = async (input: CreateLoyaltyCampaignInput) => {
        setIsSaving(true);
        setSaveError(null);
        setSuccess(null);
        try {
            if (editingCampaign) {
                await loyaltyService.updateCampaign(editingCampaign.id, input);
                setSuccess("Borrador actualizado correctamente.");
            } else {
                await loyaltyService.createCampaign(input);
                setSuccess("Campaña creada como borrador.");
            }
            setEditingCampaign(null);
            await loadData();
        } catch {
            setSaveError("No pudimos guardar la campaña.");
        } finally {
            setIsSaving(false);
        }
    };

    const runLifecycleAction = async (
        campaign: LoyaltyCampaign,
        action: "activate" | "end" | "archive" | "delete",
    ) => {
        const actionKey = `${campaign.id}:${action}`;
        if (pendingAction) return;

        setPendingAction(actionKey);
        setSaveError(null);
        setSuccess(null);
        try {
            if (action === "activate") {
                await loyaltyService.activateCampaign(campaign.id);
            } else if (action === "end") {
                await loyaltyService.endCampaign(campaign.id);
            } else if (action === "archive") {
                await loyaltyService.archiveCampaign(campaign.id);
            } else {
                await loyaltyService.deleteCampaign(campaign.id);
            }
            setSuccess(
                action === "delete"
                    ? "Campaña eliminada correctamente."
                    : "Campaña actualizada correctamente.",
            );
            if (editingCampaign?.id === campaign.id) setEditingCampaign(null);
            await loadData();
        } catch {
            setSaveError("No pudimos completar la acción de la campaña.");
        } finally {
            setPendingAction(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                    <Gift className="size-7 text-primary" aria-hidden="true" />
                    Fidelización
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Gestiona las campañas y recompensas de esta organización.
                </p>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent>
                        <p role="status" className="text-sm text-muted-foreground">
                            Cargando las campañas…
                        </p>
                    </CardContent>
                </Card>
            ) : loadError ? (
                <Card>
                    <CardContent className="space-y-4">
                        <p role="alert" className="text-sm text-destructive">
                            {loadError}
                        </p>
                        <Button variant="outline" onClick={loadData}>
                            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                            Reintentar
                        </Button>
                    </CardContent>
                </Card>
            ) : summary ? (
                <>
                    <div className="grid gap-4 md:grid-cols-5">
                        {[
                            ["Campañas", summary.stats.campaignCount],
                            ["Activas", summary.stats.activeCampaignCount],
                            ["Finalizadas", summary.stats.endedCampaignCount],
                            ["Archivadas", summary.stats.archivedCampaignCount],
                            ["Reclamos", summary.stats.totalClaims],
                        ].map(([label, value]) => (
                            <Card key={String(label)}>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-3xl font-bold">
                                        {Number(value).toLocaleString("es")}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle>
                                        {editingCampaign
                                            ? "Editar borrador"
                                            : "Nueva campaña"}
                                    </CardTitle>
                                    <CardDescription>
                                        La recompensa se crea junto con la campaña; no se selecciona un cupón existente.
                                    </CardDescription>
                                </div>
                                {editingCampaign && (
                                    <Button variant="outline" onClick={() => setEditingCampaign(null)}>
                                        <Plus className="mr-2 size-4" aria-hidden="true" />
                                        Nueva campaña
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <LoyaltyCampaignForm
                                key={editingCampaign?.id ?? "new"}
                                campaign={editingCampaign}
                                tenantType={summary.type}
                                onSave={saveCampaign}
                                onCancel={() => setEditingCampaign(null)}
                                isSaving={isSaving}
                                error={saveError}
                                success={success}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Campañas</CardTitle>
                            <CardDescription>
                                Gestiona el estado y el ciclo de vida de cada campaña.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {campaigns.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Todavía no hay campañas configuradas.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {campaigns.map((campaign) => {
                                        const status = STATUS_COPY[campaign.status];
                                        return (
                                            <article
                                                key={campaign.id}
                                                className="rounded-lg border p-4"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="font-semibold">
                                                            {campaign.name}
                                                        </h3>
                                                        {campaign.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {campaign.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant={status.variant}>
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                                    <div>
                                                        <dt className="text-muted-foreground">Métrica</dt>
                                                        <dd>
                                                            {campaign.metric === "COUNT"
                                                                ? `${campaign.targetValue} completados`
                                                                : `${campaign.targetValue} de gasto`}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-muted-foreground">Fechas</dt>
                                                        <dd>
                                                            {formatDate(campaign.startsAt)} – {formatDate(campaign.endsAt)}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-muted-foreground">Recompensa</dt>
                                                        <dd>
                                                            {campaign.reward
                                                                ? campaign.reward.type === "PERCENT"
                                                                    ? `${campaign.reward.value}%`
                                                                    : `${campaign.reward.value}`
                                                                : "Sin definición"}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-muted-foreground">Reclamos</dt>
                                                        <dd>
                                                            {campaign.claimedCount}
                                                            {campaign.maxClaims != null
                                                                ? ` / ${campaign.maxClaims}`
                                                                : ""}
                                                        </dd>
                                                    </div>
                                                </dl>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {campaign.status === "DRAFT" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    void runLifecycleAction(campaign, "activate")
                                                                }
                                                                disabled={pendingAction !== null}
                                                            >
                                                                <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
                                                                Activar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setEditingCampaign(campaign)}
                                                                disabled={pendingAction !== null}
                                                            >
                                                                <Pencil className="mr-2 size-4" aria-hidden="true" />
                                                                Editar borrador
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    void runLifecycleAction(campaign, "delete")
                                                                }
                                                                disabled={pendingAction !== null}
                                                            >
                                                                <Trash2 className="mr-2 size-4" aria-hidden="true" />
                                                                Eliminar
                                                            </Button>
                                                        </>
                                                    )}
                                                    {campaign.status === "ACTIVE" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                void runLifecycleAction(campaign, "end")
                                                            }
                                                            disabled={pendingAction !== null}
                                                        >
                                                            <Square className="mr-2 size-4" aria-hidden="true" />
                                                            Finalizar
                                                        </Button>
                                                    )}
                                                    {campaign.status === "ENDED" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                void runLifecycleAction(campaign, "archive")
                                                            }
                                                            disabled={pendingAction !== null}
                                                        >
                                                            <Archive className="mr-2 size-4" aria-hidden="true" />
                                                            Archivar
                                                        </Button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
