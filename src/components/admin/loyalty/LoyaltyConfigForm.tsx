"use client";

import type { FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoyaltyConfig } from "@/services/loyalty.service";
import type { Coupon } from "@/types/coupon.types";

interface LoyaltyConfigFormProps {
    value: LoyaltyConfig;
    onChange: (value: LoyaltyConfig) => void;
    onSave: (value: LoyaltyConfig) => Promise<void>;
    isSaving: boolean;
    disabled?: boolean;
    error?: string | null;
    success?: string | null;
    couponOptions?: Coupon[];
}

export function LoyaltyConfigForm({
    value,
    onChange,
    onSave,
    isSaving,
    disabled = false,
    error,
    success,
    couponOptions,
}: LoyaltyConfigFormProps) {
    const rewardCouponId = value.rewardCouponId ?? "";
    const valid =
        Number.isInteger(value.targetPoints) &&
        value.targetPoints > 0 &&
        rewardCouponId.trim().length > 0;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!valid || isSaving || disabled) return;

        await onSave({
            targetPoints: value.targetPoints,
            rewardCouponId: rewardCouponId.trim(),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="loyalty-target-points">Puntos objetivo</Label>
                    <Input
                        id="loyalty-target-points"
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={value.targetPoints}
                        onChange={(event) =>
                            onChange({
                                ...value,
                                targetPoints: Number(event.target.value),
                            })
                        }
                        disabled={disabled || isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                        Puntos que debe acumulada una persona para reclamar una recompensa.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="loyalty-reward-coupon">
                        ID del cupón de recompensa
                    </Label>
                    {couponOptions ? (
                        <select
                            id="loyalty-reward-coupon"
                            required
                            value={rewardCouponId}
                            onChange={(event) =>
                                onChange({
                                    ...value,
                                    rewardCouponId: event.target.value,
                                })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={disabled || isSaving}
                        >
                            <option value="">Selecciona un cupón</option>
                            {couponOptions.map((coupon) => (
                                <option key={coupon.id} value={coupon.id}>
                                    {coupon.code} · {coupon.type === "PERCENT"
                                        ? `${coupon.value}%`
                                        : `$${coupon.value}`}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <Input
                            id="loyalty-reward-coupon"
                            required
                            value={rewardCouponId}
                            onChange={(event) =>
                                onChange({
                                    ...value,
                                    rewardCouponId: event.target.value,
                                })
                            }
                            placeholder="UUID del cupón"
                            disabled={disabled || isSaving}
                        />
                    )}
                    <p className="text-xs text-muted-foreground">
                        Plantilla de cupón entregada al alcanzar el objetivo.
                    </p>
                </div>
            </div>

            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
            {success && (
                <p role="status" className="text-sm text-emerald-600">
                    {success}
                </p>
            )}

            <Button type="submit" disabled={!valid || isSaving || disabled}>
                <Save className="mr-2 size-4" aria-hidden="true" />
                {isSaving ? "Guardando…" : "Guardar configuración"}
            </Button>
        </form>
    );
}
