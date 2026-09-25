"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Gift, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useFeatures } from "@/hooks/useFeatures";
import {
    loyaltyService,
    type LoyaltyCampaignSource,
    type LoyaltyCustomerCampaignSummary,
} from "@/services/loyalty.service";

const STATUS_COPY = {
    NOT_STARTED: "La campaña todavía no ha comenzado.",
    IN_PROGRESS: "Tu recompensa está en progreso.",
    READY: "Tu recompensa está lista para reclamar.",
    CLAIMED: "Has reclamado tu recompensa.",
    EXPIRED: "La recompensa expiró y ya no se puede reclamar.",
} as const;

const SOURCE_COPY: Record<LoyaltyCampaignSource, string> = {
    BOOKING: "Reservas",
    STORE: "Tienda",
    ALL: "Reservas y tienda",
};

function decimalToCents(value: string): bigint {
    const [whole, fraction = ""] = value.split(".");
    return (
        BigInt(whole || "0") * BigInt(100) +
        BigInt(fraction.padEnd(2, "0").slice(0, 2))
    );
}

function progressPercentage(
    progressValue: string,
    targetValue: string,
): number {
    const target = decimalToCents(targetValue);
    if (target <= BigInt(0)) return 0;
    const progress = decimalToCents(progressValue);
    return Number(
        (progress * BigInt(100)) / target > BigInt(100)
            ? BigInt(100)
            : (progress * BigInt(100)) / target,
    );
}

function formatCount(value: string): string {
    return BigInt(value.split(".")[0] || "0").toLocaleString("es");
}

function formatDecimal(value: string): string {
    const [whole, fraction = ""] = value.split(".");
    return `${BigInt(whole || "0").toLocaleString("es")},${fraction
        .padEnd(2, "0")
        .slice(0, 2)}`;
}

function campaignPriority(
    summary: LoyaltyCustomerCampaignSummary,
): number {
    if (summary.lifecycleStatus === "ACTIVE") return 0;
    if (summary.customerStatus === "READY") return 1;
    if (summary.customerStatus === "CLAIMED") return 2;
    if (summary.lifecycleStatus === "ENDED") return 3;
    if (summary.customerStatus === "EXPIRED") return 4;
    return 5;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeZone: "UTC",
    }).format(new Date(value));
}

export function LoyaltyCard() {
    const { isFeatureEnabled } = useFeatures();
    const enabled =
        isFeatureEnabled("LOYALTY") && isFeatureEnabled("COUPONS");
    const [summaries, setSummaries] = useState<
        LoyaltyCustomerCampaignSummary[]
    >([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [isLoading, setIsLoading] = useState(enabled);
    const [claimingCampaignId, setClaimingCampaignId] = useState<string | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const claimingRef = useRef<string | null>(null);

    const loadSummaries = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const nextSummaries = await loyaltyService.getMyCampaigns();
            setSummaries((current) => {
                const previous = new Map(
                    current.map((summary) => [summary.campaignId, summary]),
                );
                return nextSummaries
                    .filter(
                        (summary) => summary.lifecycleStatus !== "DRAFT",
                    )
                    .map((summary) => {
                        const prior = previous.get(summary.campaignId);
                        if (summary.customerStatus !== "CLAIMED") return summary;
                        return {
                            ...summary,
                            claim: summary.claim ?? prior?.claim,
                            coupon: summary.coupon ?? prior?.coupon,
                        };
                    });
            });
            return true;
        } catch {
            setError("No pudimos cargar tus campañas de fidelización.");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enabled) void loadSummaries();
    }, [enabled, loadSummaries]);

    if (!enabled) return null;

    const visibleCampaigns = [...summaries].sort(
        (left, right) => campaignPriority(left) - campaignPriority(right),
    );
    const selectedCampaign =
        visibleCampaigns.find(
            (summary) => summary.campaignId === selectedCampaignId,
        ) ?? visibleCampaigns[0];
    const progress = selectedCampaign
        ? progressPercentage(
              selectedCampaign.progressValue,
              selectedCampaign.targetValue,
          )
        : 0;

    const claimReward = async () => {
        if (!selectedCampaign || claimingRef.current) return;
        const campaignId = selectedCampaign.campaignId;

        claimingRef.current = campaignId;
        setClaimingCampaignId(campaignId);
        setError(null);
        setCopied(false);

        try {
            const claim = await loyaltyService.claimReward(campaignId);
            const { coupon, ...claimMetadata } = claim;
            setSummaries((current) =>
                current.map((summary) =>
                    summary.campaignId === campaignId
                        ? {
                              ...summary,
                              customerStatus: "CLAIMED",
                              claim: claimMetadata,
                              coupon,
                          }
                        : summary,
                ),
            );
            setSelectedCampaignId(campaignId);
            const refreshed = await loadSummaries();
            if (!refreshed) {
                setError(
                    "La recompensa se obtuvo, pero no pudimos actualizar las campañas.",
                );
            }
        } catch {
            setError("No pudimos reclamar la recompensa. Inténtalo de nuevo.");
        } finally {
            claimingRef.current = null;
            setClaimingCampaignId(null);
        }
    };

    const copyCoupon = async () => {
        if (!selectedCampaign?.coupon?.code) return;

        try {
            await navigator.clipboard.writeText(selectedCampaign.coupon.code);
            setCopied(true);
        } catch {
            setError("No pudimos copiar el código. Cópialo manualmente.");
        }
    };

    return (
        <Card aria-labelledby="loyalty-card-title">
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Gift className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                        <CardTitle
                            id="loyalty-card-title"
                            role="heading"
                            aria-level={3}
                        >
                            Programa de fidelización
                        </CardTitle>
                        <CardDescription>
                            Completa objetivos o acumula gasto para recibir recompensas.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {isLoading ? (
                    <p role="status" className="text-sm text-muted-foreground">
                        Cargando tus campañas…
                    </p>
                ) : visibleCampaigns.length === 0 ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            No hay campañas de fidelización disponibles en este momento.
                        </p>
                        {error && (
                            <p role="alert" className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                        <Button variant="outline" onClick={loadSummaries}>
                            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                            Reintentar
                        </Button>
                    </div>
                ) : selectedCampaign ? (
                    <>
                        {visibleCampaigns.length > 1 && (
                            <div className="space-y-2">
                                <label
                                    htmlFor="loyalty-campaign"
                                    className="text-sm font-medium"
                                >
                                    Campaña
                                </label>
                                <select
                                    id="loyalty-campaign"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedCampaign.campaignId}
                                    onChange={(event) => {
                                        setSelectedCampaignId(event.target.value);
                                        setCopied(false);
                                    }}
                                    disabled={claimingCampaignId !== null}
                                >
                                    {visibleCampaigns.map((summary) => (
                                        <option
                                            key={summary.campaignId}
                                            value={summary.campaignId}
                                        >
                                            {summary.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <p className="text-lg font-semibold">
                                {selectedCampaign.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {`${SOURCE_COPY[selectedCampaign.source]} · Del ${formatDate(selectedCampaign.startsAt)} al ${formatDate(selectedCampaign.endsAt)} · Reclamable hasta ${formatDate(selectedCampaign.claimUntil)}`}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-4xl font-bold tracking-tight">
                                    {selectedCampaign.metric === "COUNT"
                                        ? formatCount(selectedCampaign.progressValue)
                                        : formatDecimal(selectedCampaign.progressValue)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedCampaign.metric === "COUNT"
                                        ? `de ${formatCount(selectedCampaign.targetValue)} completados`
                                        : `de ${formatDecimal(selectedCampaign.targetValue)} de gasto neto`}
                                </p>
                            </div>
                            <p className="max-w-sm text-sm font-medium text-primary">
                                {selectedCampaign.customerStatus === "IN_PROGRESS"
                                    ? selectedCampaign.metric === "COUNT"
                                        ? `Te faltan ${formatCount(selectedCampaign.remainingValue)} completados`
                                        : `Te faltan ${formatDecimal(selectedCampaign.remainingValue)} de gasto neto`
                                    : STATUS_COPY[selectedCampaign.customerStatus]}
                            </p>
                        </div>

                        <div
                            role="progressbar"
                            aria-label="Progreso hacia la recompensa"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                            className="h-2 overflow-hidden rounded-full bg-muted"
                        >
                            <div
                                className="h-full rounded-full bg-primary transition-[width]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {selectedCampaign.customerStatus === "READY" && (
                            <Button
                                onClick={claimReward}
                                disabled={claimingCampaignId !== null}
                                className="w-full sm:w-auto"
                            >
                                <Gift className="mr-2 size-4" aria-hidden="true" />
                                {claimingCampaignId === selectedCampaign.campaignId
                                    ? "Reclamando…"
                                    : "Reclamar recompensa"}
                            </Button>
                        )}

                        {selectedCampaign.claim && (
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm font-medium">
                                    Recompensa reclamada
                                </p>
                                <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                                    <div>Reclamo: {selectedCampaign.claim.id}</div>
                                    <div>Cupón: {selectedCampaign.claim.couponId}</div>
                                    <div>
                                        Fecha: {formatDate(selectedCampaign.claim.createdAt)}
                                    </div>
                                </dl>
                            </div>
                        )}

                        {selectedCampaign.coupon?.code && (
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm font-medium">
                                    Tu código de recompensa
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <code className="rounded bg-background px-3 py-2 text-base font-semibold">
                                        {selectedCampaign.coupon.code}
                                    </code>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={copyCoupon}
                                    >
                                        <Copy className="mr-2 size-4" aria-hidden="true" />
                                        Copiar código
                                    </Button>
                                </div>
                                {copied && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Código copiado al portapapeles.
                                    </p>
                                )}
                            </div>
                        )}

                        {error && (
                            <p role="alert" className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </>
                ) : null}
            </CardContent>
        </Card>
    );
}
