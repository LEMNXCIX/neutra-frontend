"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
    CreateLoyaltyCampaignInput,
    LoyaltyCampaign,
    LoyaltyCampaignMetric,
    LoyaltyCampaignSource,
} from "@/services/loyalty.service";
import { CouponType } from "@/types/coupon.types";

interface LoyaltyCampaignFormProps {
    campaign?: LoyaltyCampaign | null;
    tenantType?: string;
    onSave: (campaign: CreateLoyaltyCampaignInput) => Promise<void>;
    onCancel?: () => void;
    isSaving: boolean;
    error?: string | null;
    success?: string | null;
}

interface FormValue {
    name: string;
    description: string;
    source: LoyaltyCampaignSource;
    metric: LoyaltyCampaignMetric;
    targetValue: string;
    startsAt: string;
    endsAt: string;
    claimUntil: string;
    rewardType: CouponType;
    rewardValue: string;
    rewardDescription: string;
    minPurchaseAmount: string;
    maxDiscountAmount: string;
    applicableProducts: string;
    applicableCategories: string;
    applicableServices: string;
    rewardValidDays: string;
    maxClaims: string;
}

const selectClassName =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50";
const MAX_INT = 2_147_483_647;
const POSITIVE_FIXED_DECIMAL_PATTERN =
    /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/;

function dateInputValue(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function initialValue(
    campaign: LoyaltyCampaign | null | undefined,
    tenantType?: string,
): FormValue {
    return {
        name: campaign?.name ?? "",
        description: campaign?.description ?? "",
        source:
            campaign?.source ??
            (tenantType === "STORE" ? "STORE" : "BOOKING"),
        metric: campaign?.metric ?? "COUNT",
        targetValue: campaign?.targetValue ?? "",
        startsAt: dateInputValue(campaign?.startsAt),
        endsAt: dateInputValue(campaign?.endsAt),
        claimUntil: dateInputValue(campaign?.claimUntil),
        rewardType: campaign?.reward?.type ?? CouponType.PERCENT,
        rewardValue: campaign?.reward?.value.toString() ?? "10",
        rewardDescription: campaign?.reward?.description ?? "",
        minPurchaseAmount:
            campaign?.reward?.minPurchaseAmount?.toString() ?? "",
        maxDiscountAmount:
            campaign?.reward?.maxDiscountAmount?.toString() ?? "",
        applicableProducts:
            campaign?.reward?.applicableProducts.join(", ") ?? "",
        applicableCategories:
            campaign?.reward?.applicableCategories.join(", ") ?? "",
        applicableServices:
            campaign?.reward?.applicableServices.join(", ") ?? "",
        rewardValidDays: campaign?.rewardValidDays?.toString() ?? "30",
        maxClaims: campaign?.maxClaims?.toString() ?? "",
    };
}

function parseIds(value: string): string[] {
    return value.trim()
        ? [
              ...new Set(
                  value
                      .split(/[\s,]+/)
                      .map((item) => item.trim())
                      .filter(Boolean),
              ),
          ]
        : [];
}

function optionalNumber(value: string): number | null {
    return value.trim() ? Number(value) : null;
}

function validInteger(value: string, required: boolean): boolean {
    if (!value.trim()) return !required;
    const parsed = Number(value);
    return (
        Number.isSafeInteger(parsed) &&
        parsed > 0 &&
        parsed <= MAX_INT
    );
}

function validAmount(value: string): boolean {
    return (
        value.trim() === "" ||
        (Number.isFinite(Number(value)) && Number(value) >= 0)
    );
}

function validTarget(value: string, metric: LoyaltyCampaignMetric): boolean {
    const normalized = value.trim();
    if (!POSITIVE_FIXED_DECIMAL_PATTERN.test(normalized)) return false;

    const [whole, fraction = ""] = normalized.split(".");
    const fractionValue = BigInt(fraction.padEnd(2, "0") || "0");
    const isPositive =
        BigInt(whole) > BigInt(0) ||
        (BigInt(whole) === BigInt(0) && fractionValue > BigInt(0));
    if (!isPositive) return false;
    if (metric === "SPEND") return true;

    return fraction === "" || fraction === "0" || fraction === "00";
}

function sourceIsSupported(
    source: LoyaltyCampaignSource,
    tenantType?: string,
): boolean {
    return !tenantType || tenantType === "HYBRID" || tenantType === source;
}

function validateCampaignForm(value: FormValue, tenantType?: string) {
    const startsAt = Date.parse(`${value.startsAt}T00:00:00.000Z`);
    const endsAt = Date.parse(`${value.endsAt}T00:00:00.000Z`);
    const claimUntil = Date.parse(`${value.claimUntil}T00:00:00.000Z`);
    const rewardValue = Number(value.rewardValue);
    const datesAreValid =
        Number.isFinite(startsAt) &&
        Number.isFinite(endsAt) &&
        Number.isFinite(claimUntil) &&
        startsAt < endsAt &&
        endsAt <= claimUntil;
    const rewardIsValid =
        Number.isFinite(rewardValue) &&
        rewardValue > 0 &&
        (value.rewardType !== CouponType.PERCENT || rewardValue <= 100);
    const valid =
        value.name.trim().length > 0 &&
        sourceIsSupported(value.source, tenantType) &&
        validTarget(value.targetValue, value.metric) &&
        datesAreValid &&
        rewardIsValid &&
        validAmount(value.minPurchaseAmount) &&
        validAmount(value.maxDiscountAmount) &&
        validInteger(value.rewardValidDays, true) &&
        validInteger(value.maxClaims, false);

    return { valid, rewardValue };
}

type UpdateFormValue = <Key extends keyof FormValue>(
    key: Key,
    nextValue: FormValue[Key],
) => void;

function CampaignBasicsFields({
    value,
    update,
    isSaving,
    tenantType,
}: {
    value: FormValue;
    update: UpdateFormValue;
    isSaving: boolean;
    tenantType?: string;
}) {
    return (
            <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="campaign-name">Nombre</Label>
                    <Input
                        id="campaign-name"
                        required
                        value={value.name}
                        onChange={(event) => update("name", event.target.value)}
                        disabled={isSaving}
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="campaign-description">
                        Descripción de la campaña
                    </Label>
                    <Textarea
                        id="campaign-description"
                        value={value.description}
                        onChange={(event) =>
                            update("description", event.target.value)
                        }
                        disabled={isSaving}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="campaign-source">Origen</Label>
                    <select
                        id="campaign-source"
                        className={selectClassName}
                        value={value.source}
                        onChange={(event) =>
                            update(
                                "source",
                                event.target.value as LoyaltyCampaignSource,
                            )
                        }
                        disabled={isSaving}
                    >
                        {(["BOOKING", "STORE", "ALL"] as const).map((source) => (
                            <option
                                key={source}
                                value={source}
                                disabled={!sourceIsSupported(source, tenantType)}
                            >
                                {source === "BOOKING"
                                    ? "Reservas"
                                    : source === "STORE"
                                      ? "Tienda"
                                      : "Reservas y tienda"}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="campaign-metric">Métrica</Label>
                    <select
                        id="campaign-metric"
                        className={selectClassName}
                        value={value.metric}
                        onChange={(event) =>
                            update(
                                "metric",
                                event.target.value as LoyaltyCampaignMetric,
                            )
                        }
                        disabled={isSaving}
                    >
                        <option value="COUNT">Cantidad completada</option>
                        <option value="SPEND">Gasto neto</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="campaign-target">Objetivo</Label>
                    <Input
                        id="campaign-target"
                        required
                        inputMode="decimal"
                        value={value.targetValue}
                        onChange={(event) =>
                            update("targetValue", event.target.value)
                        }
                        disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                        Entero para COUNT; hasta dos decimales para SPEND.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="campaign-reward-valid-days">
                        Validez de la recompensa (días)
                    </Label>
                    <Input
                        id="campaign-reward-valid-days"
                        type="number"
                        min={1}
                        max={MAX_INT}
                        step={1}
                        required
                        value={value.rewardValidDays}
                        onChange={(event) =>
                            update("rewardValidDays", event.target.value)
                        }
                        disabled={isSaving}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="campaign-starts-at">Inicio</Label>
                    <Input
                        id="campaign-starts-at"
                        type="date"
                        required
                        value={value.startsAt}
                        onChange={(event) =>
                            update("startsAt", event.target.value)
                        }
                        disabled={isSaving}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="campaign-ends-at">Fin</Label>
                    <Input
                        id="campaign-ends-at"
                        type="date"
                        required
                        value={value.endsAt}
                        onChange={(event) =>
                            update("endsAt", event.target.value)
                        }
                        disabled={isSaving}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="campaign-claim-until">Reclamable hasta</Label>
                    <Input
                        id="campaign-claim-until"
                        type="date"
                        required
                        value={value.claimUntil}
                        onChange={(event) =>
                            update("claimUntil", event.target.value)
                        }
                        disabled={isSaving}
                    />
                </div>
                <p className="text-xs text-muted-foreground md:col-span-2">
                    Fechas en UTC: cada fecha se convierte a medianoche UTC antes de enviarse.
                </p>
                <div className="space-y-2">
                    <Label htmlFor="campaign-max-claims">Límite de reclamos</Label>
                    <Input
                        id="campaign-max-claims"
                        type="number"
                        min={1}
                        max={MAX_INT}
                        step={1}
                        value={value.maxClaims}
                        onChange={(event) =>
                            update("maxClaims", event.target.value)
                        }
                        disabled={isSaving}
                    />
                </div>
            </div>
    );
}

function CampaignRewardFields({
    value,
    update,
    isSaving,
}: {
    value: FormValue;
    update: UpdateFormValue;
    isSaving: boolean;
}) {
    return (
            <fieldset className="space-y-5 rounded-lg border p-5">
                <legend className="px-1 font-semibold">Definición de recompensa</legend>
                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="reward-type">Tipo</Label>
                        <select
                            id="reward-type"
                            className={selectClassName}
                            value={value.rewardType}
                            onChange={(event) =>
                                update("rewardType", event.target.value as CouponType)
                            }
                            disabled={isSaving}
                        >
                            <option value={CouponType.PERCENT}>Porcentaje</option>
                            <option value={CouponType.FIXED}>Importe fijo</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reward-value">Valor</Label>
                        <Input
                            id="reward-value"
                            type="number"
                            min={0}
                            step="0.01"
                            required
                            value={value.rewardValue}
                            onChange={(event) =>
                                update("rewardValue", event.target.value)
                            }
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="reward-description">
                            Descripción de la recompensa
                        </Label>
                        <Textarea
                            id="reward-description"
                            value={value.rewardDescription}
                            onChange={(event) =>
                                update("rewardDescription", event.target.value)
                            }
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reward-min-purchase">Compra mínima</Label>
                        <Input
                            id="reward-min-purchase"
                            type="number"
                            min={0}
                            step="0.01"
                            value={value.minPurchaseAmount}
                            onChange={(event) =>
                                update("minPurchaseAmount", event.target.value)
                            }
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reward-max-discount">Descuento máximo</Label>
                        <Input
                            id="reward-max-discount"
                            type="number"
                            min={0}
                            step="0.01"
                            value={value.maxDiscountAmount}
                            onChange={(event) =>
                                update("maxDiscountAmount", event.target.value)
                            }
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reward-products">IDs de productos</Label>
                        <Textarea
                            id="reward-products"
                            placeholder="product-1, product-2"
                            value={value.applicableProducts}
                            onChange={(event) =>
                                update("applicableProducts", event.target.value)
                            }
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reward-categories">IDs de categorías</Label>
                        <Textarea
                            id="reward-categories"
                            placeholder="category-1, category-2"
                            value={value.applicableCategories}
                            onChange={(event) =>
                                update("applicableCategories", event.target.value)
                            }
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reward-services">IDs de servicios</Label>
                        <Textarea
                            id="reward-services"
                            placeholder="service-1, service-2"
                            value={value.applicableServices}
                            onChange={(event) =>
                                update("applicableServices", event.target.value)
                            }
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </fieldset>
    );
}

export function LoyaltyCampaignForm({
    campaign,
    tenantType,
    onSave,
    onCancel,
    isSaving,
    error,
    success,
}: LoyaltyCampaignFormProps) {
    const [value, setValue] = useState<FormValue>(() =>
        initialValue(campaign, tenantType),
    );

    const { valid, rewardValue } = validateCampaignForm(value, tenantType);

    const update = <Key extends keyof FormValue>(
        key: Key,
        nextValue: FormValue[Key],
    ) => setValue((current) => ({ ...current, [key]: nextValue }));

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!valid || isSaving) return;

        await onSave({
            name: value.name.trim(),
            description: value.description.trim() || null,
            source: value.source,
            metric: value.metric,
            targetValue: value.targetValue.trim(),
            startsAt: `${value.startsAt}T00:00:00.000Z`,
            endsAt: `${value.endsAt}T00:00:00.000Z`,
            claimUntil: `${value.claimUntil}T00:00:00.000Z`,
            reward: {
                type: value.rewardType,
                value: rewardValue,
                description: value.rewardDescription.trim() || null,
                minPurchaseAmount: optionalNumber(value.minPurchaseAmount),
                maxDiscountAmount: optionalNumber(value.maxDiscountAmount),
                applicableProducts: parseIds(value.applicableProducts),
                applicableCategories: parseIds(value.applicableCategories),
                applicableServices: parseIds(value.applicableServices),
            },
            rewardValidDays: Number(value.rewardValidDays),
            maxClaims: optionalNumber(value.maxClaims),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <CampaignBasicsFields
                value={value}
                update={update}
                isSaving={isSaving}
                tenantType={tenantType}
            />

            <CampaignRewardFields
                value={value}
                update={update}
                isSaving={isSaving}
            />

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

            <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={!valid || isSaving}>
                    <Save className="mr-2 size-4" aria-hidden="true" />
                    {isSaving
                        ? "Guardando…"
                        : campaign
                          ? "Guardar borrador"
                          : "Crear borrador"}
                </Button>
                {campaign && onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </Button>
                )}
            </div>
        </form>
    );
}
