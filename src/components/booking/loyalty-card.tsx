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
    type LoyaltySummary,
} from "@/services/loyalty.service";

const STATUS_COPY = {
    IN_PROGRESS: "Tu próxima recompensa está más cerca.",
    READY: "Tu recompensa está lista para reclamar.",
    CLAIMED: "Has reclamado tu recompensa.",
    NOT_CONFIGURED: "El programa de puntos aún no está configurado.",
} as const;

export function LoyaltyCard() {
    const { isFeatureEnabled } = useFeatures();
    const enabled = isFeatureEnabled("LOYALTY");
    const [summary, setSummary] = useState<LoyaltySummary | null>(null);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isClaiming, setIsClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const claimingRef = useRef(false);
    const claimedRef = useRef(false);

    const loadSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const nextSummary = await loyaltyService.getMySummary();
            setSummary(nextSummary);
            if (nextSummary.status === "CLAIMED") {
                claimedRef.current = true;
            }
        } catch {
            setError("No pudimos cargar tu programa de fidelización.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enabled) {
            void loadSummary();
        }
    }, [enabled, loadSummary]);

    if (!enabled || summary?.status === "NOT_CONFIGURED") return null;

    const targetPoints = summary?.targetPoints ?? 0;
    const progress =
        targetPoints > 0
            ? Math.min(100, Math.round(((summary?.points ?? 0) / targetPoints) * 100))
            : 0;
    const couponCode = summary?.coupon?.code;

    const claimReward = async () => {
        if (claimingRef.current || claimedRef.current) return;

        claimingRef.current = true;
        setIsClaiming(true);
        setError(null);
        setCopied(false);

        try {
            const claim = await loyaltyService.claimReward();
            claimedRef.current = true;
            setSummary((current) =>
                current
                    ? {
                          ...current,
                          status: "CLAIMED",
                          coupon: claim.coupon ?? current.coupon,
                      }
                    : current,
            );

            try {
                const refreshedSummary = await loyaltyService.getMySummary();
                setSummary({
                    ...refreshedSummary,
                    status: "CLAIMED",
                    coupon: refreshedSummary.coupon ?? claim.coupon,
                });
            } catch {
                setError(
                    "La recompensa se obtuvo, pero no pudimos actualizar el resumen.",
                );
            }
        } catch {
            setError("No pudimos reclamar la recompensa. Inténtalo de nuevo.");
        } finally {
            claimingRef.current = false;
            setIsClaiming(false);
        }
    };

    const copyCoupon = async () => {
        if (!couponCode) return;

        try {
            await navigator.clipboard.writeText(couponCode);
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
                            Acumula puntos con tus reservas y recibe recompensas.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {isLoading ? (
                    <p role="status" className="text-sm text-muted-foreground">
                        Cargando tus puntos…
                    </p>
                ) : error && !summary ? (
                    <div role="alert" className="space-y-3">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button variant="outline" onClick={loadSummary}>
                            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                            Reintentar
                        </Button>
                    </div>
                ) : summary ? (
                    <>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-4xl font-bold tracking-tight">
                                    {summary.points.toLocaleString("es")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    de {targetPoints.toLocaleString("es")} puntos
                                </p>
                            </div>
                            <p className="text-sm font-medium text-primary">
                                {summary.status === "IN_PROGRESS"
                                    ? `Te faltan ${summary.remaining.toLocaleString("es")} puntos`
                                    : STATUS_COPY[summary.status]}
                            </p>
                        </div>

                        {targetPoints > 0 && (
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
                        )}

                        {summary.status === "READY" && (
                            <Button
                                onClick={claimReward}
                                disabled={isClaiming}
                                className="w-full sm:w-auto"
                            >
                                <Gift className="mr-2 size-4" aria-hidden="true" />
                                {isClaiming ? "Reclamando…" : "Reclamar recompensa"}
                            </Button>
                        )}

                        {couponCode && (
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm font-medium">
                                    Tu código de recompensa
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <code className="rounded bg-background px-3 py-2 text-base font-semibold">
                                        {couponCode}
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
