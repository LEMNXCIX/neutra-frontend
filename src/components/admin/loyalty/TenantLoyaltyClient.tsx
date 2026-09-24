"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, RefreshCw } from "lucide-react";
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
    type LoyaltyAdminSummary,
    type LoyaltyConfig,
} from "@/services/loyalty.service";
import { LoyaltyConfigForm } from "@/components/admin/loyalty/LoyaltyConfigForm";
import { couponsService } from "@/services/coupons.service";
import type { Coupon } from "@/types/coupon.types";

export function TenantLoyaltyClient() {
    const { isFeatureEnabled } = useFeatures();
    const enabled = isFeatureEnabled("LOYALTY");
    const [summary, setSummary] = useState<LoyaltyAdminSummary | null>(null);
    const [config, setConfig] = useState<LoyaltyConfig>({
        targetPoints: 0,
        rewardCouponId: "",
    });
    const [couponOptions, setCouponOptions] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [nextSummary, nextConfig, nextCoupons] =
                await Promise.all([
                    loyaltyService.getAdminSummary(),
                    loyaltyService.getAdminConfig(),
                    couponsService.getAll(),
                ]);
            setSummary(nextSummary);
            setConfig(nextConfig);
            setCouponOptions(
                nextCoupons.filter(
                    (coupon) =>
                        coupon.active &&
                        !coupon.isReward &&
                        coupon.ownerId == null &&
                        new Date(coupon.expiresAt).getTime() > Date.now() &&
                        (coupon.usageLimit == null ||
                            coupon.usageCount < coupon.usageLimit),
                ),
            );
        } catch {
            setLoadError("No pudimos cargar la información de fidelización.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enabled) {
            void loadData();
        }
    }, [enabled, loadData]);

    if (!enabled) return null;

    const saveConfig = async (nextConfig: LoyaltyConfig) => {
        setIsSaving(true);
        setSaveError(null);
        setSuccess(null);
        try {
            const savedConfig = await loyaltyService.updateAdminConfig(nextConfig);
            setConfig(savedConfig);
            setSuccess("Configuración guardada correctamente.");
        } catch {
            setSaveError("No pudimos guardar la configuración.");
        } finally {
            setIsSaving(false);
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
                    Gestiona el programa de puntos y la recompensa de esta organización.
                </p>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent>
                        <p role="status" className="text-sm text-muted-foreground">
                            Cargando la información de fidelización…
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
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Puntos acumulados
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {summary.stats.totalPoints.toLocaleString("es")}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Recompensas reclamadas
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {summary.stats.totalClaims.toLocaleString("es")}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Clientes activos
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {summary.stats.activeCustomers.toLocaleString("es")}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de recompensas</CardTitle>
                            <CardDescription>
                                Define el objetivo y la plantilla de cupón para nuevas recompensas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LoyaltyConfigForm
                                value={config}
                                onChange={setConfig}
                                onSave={saveConfig}
                                couponOptions={couponOptions}
                                isSaving={isSaving}
                                error={saveError}
                                success={success}
                            />
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
