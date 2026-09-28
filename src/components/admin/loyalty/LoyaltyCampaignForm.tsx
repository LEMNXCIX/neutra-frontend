"use client";

import { Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { categoriesService } from "@/services/categories.service";
import type {
    CreateLoyaltyCampaignInput,
    LoyaltyCampaign,
    LoyaltyCampaignMetric,
    LoyaltyCampaignSource,
} from "@/services/loyalty.service";
import { productsService } from "@/services/products.service";
import { type ServiceItem, servicesService } from "@/services/services.service";
import type { Category } from "@/types/category.types";
import { CouponType } from "@/types/coupon.types";
import type { Product } from "@/types/product.types";

interface LoyaltyCampaignFormProps {
    campaign?: LoyaltyCampaign | null;
    tenantType?: string;
    onSave: (campaign: CreateLoyaltyCampaignInput) => Promise<void>;
    onCancel?: () => void;
    isSaving: boolean;
    error?: string | null;
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
    /**
     * Días de prórroga después de `endsAt` durante los que todavía se puede
     * reclamar. No se envía al backend: es la forma de editar `claimUntil`
     * sin tener que hacer la cuenta de días a mano. El backend recibe solo la
     * fecha ya resuelta.
     */
    claimGraceDays: string;
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
const POSITIVE_FIXED_DECIMAL_PATTERN = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/;

function dateInputValue(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

const DEFAULT_CLAIM_GRACE_DAYS = "7";

/** Suma días a una fecha `YYYY-MM-DD` tratada como medianoche UTC. */
function addDays(iso: string, days: number): string {
    if (!iso || !Number.isFinite(days)) return "";
    const date = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return "";
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

/** Días entre dos fechas `YYYY-MM-DD`, o null si alguna no es válida. */
function daysBetween(from: string, to: string): number | null {
    if (!from || !to) return null;
    const start = new Date(`${from}T00:00:00.000Z`).getTime();
    const end = new Date(`${to}T00:00:00.000Z`).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return Math.round((end - start) / 86_400_000);
}

function initialValue(
    campaign: LoyaltyCampaign | null | undefined,
    tenantType?: string,
): FormValue {
    const endsAt = dateInputValue(campaign?.endsAt);
    const claimUntil = dateInputValue(campaign?.claimUntil);
    const storedGrace = daysBetween(endsAt, claimUntil);

    return {
        name: campaign?.name ?? "",
        description: campaign?.description ?? "",
        source: campaign?.source ?? deriveSource(tenantType),
        metric: campaign?.metric ?? "COUNT",
        targetValue: campaign?.targetValue ?? "",
        startsAt: dateInputValue(campaign?.startsAt),
        endsAt,
        claimUntil: claimUntil || (endsAt ? addDays(endsAt, 7) : ""),
        claimGraceDays:
            storedGrace !== null && storedGrace >= 0
                ? String(storedGrace)
                : DEFAULT_CLAIM_GRACE_DAYS,
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
    return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= MAX_INT;
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

/**
 * The campaign source is a property of the tenant, not a choice: a store tenant
 * can only run STORE campaigns and a booking tenant only BOOKING ones, which the
 * backend enforces in assertLoyaltyCampaignSourceCompatible. A hybrid tenant
 * accepts all three and ALL is the only value always valid for it, so that is
 * the derived default. The value is still stored, because an existing campaign
 * keeps the source it was created with.
 */
function deriveSource(tenantType?: string): LoyaltyCampaignSource {
    if (tenantType === "STORE") return "STORE";
    if (tenantType === "BOOKING") return "BOOKING";
    return "ALL";
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
    claimGraceWarning,
}: {
    value: FormValue;
    update: UpdateFormValue;
    isSaving: boolean;
    tenantType?: string;
    claimGraceWarning?: string;
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
                <p className="text-xs text-muted-foreground">
                    Se cuenta desde que el cliente reclama, no desde que termina
                    la campaña. Si la campaña dura 15 días y la validez es 2,
                    quien reclame el último día tiene un cupón válido 2 días
                    más.
                </p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="campaign-starts-at">Inicio de la campaña</Label>
                <Input
                    id="campaign-starts-at"
                    type="date"
                    required
                    value={value.startsAt}
                    onChange={(event) => update("startsAt", event.target.value)}
                    disabled={isSaving}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="campaign-ends-at">Fin de la campaña</Label>
                <Input
                    id="campaign-ends-at"
                    type="date"
                    required
                    value={value.endsAt}
                    onChange={(event) => update("endsAt", event.target.value)}
                    disabled={isSaving}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="campaign-claim-grace-days">
                    Días de prórroga para reclamar
                </Label>
                <Input
                    id="campaign-claim-grace-days"
                    type="number"
                    min={0}
                    max={MAX_INT}
                    step={1}
                    value={value.claimGraceDays}
                    onChange={(event) =>
                        update("claimGraceDays", event.target.value)
                    }
                    disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                    Se cuenta desde el fin de la campaña, no desde el inicio.
                </p>
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
                {claimGraceWarning && (
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                        {claimGraceWarning}
                    </p>
                )}
            </div>
            <p className="text-xs text-muted-foreground md:col-span-2">
                Fechas en UTC: cada fecha se convierte a medianoche UTC antes de
                enviarse.
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

type PickerOption = { id: string; name: string };

/**
 * Names the reward can be applied to, as checkboxes.
 *
 * The three ID textareas asked an admin to copy a UUID per product by hand, which
 * is the kind of input that produces a broken campaign that only fails at
 * checkout. Showing the name removes the transcription step entirely.
 *
 * The form value stays a comma-joined string of ids, so initialValue, parseIds
 * and the submit payload are untouched.
 */
function ApplicablePicker({
    legend,
    options,
    selected,
    onToggle,
    isSaving,
    isLoading,
    emptyHint,
}: {
    legend: string;
    options: PickerOption[];
    selected: string[];
    onToggle: (id: string) => void;
    isSaving: boolean;
    isLoading: boolean;
    emptyHint: string;
}) {
    return (
        <fieldset className="space-y-2 md:col-span-2">
            <legend className="px-1 text-sm font-semibold">{legend}</legend>
            {isLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Spinner className="size-4" /> Cargando…
                </div>
            ) : options.length === 0 ? (
                <p className="text-xs text-muted-foreground">{emptyHint}</p>
            ) : (
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                    {options.map((option) => {
                        const checked = selected.includes(option.id);
                        return (
                            <li key={option.id}>
                                <label
                                    htmlFor={`applicable-${option.id}`}
                                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                                >
                                    <Checkbox
                                        id={`applicable-${option.id}`}
                                        checked={checked}
                                        disabled={isSaving}
                                        onCheckedChange={() =>
                                            onToggle(option.id)
                                        }
                                    />
                                    <span className="truncate">
                                        {option.name}
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            )}
            <p className="text-xs text-muted-foreground">
                Sin marcar nada, la recompensa aplica a todo el catálogo.
            </p>
        </fieldset>
    );
}

function CampaignRewardFields({
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
    // Only the catalogues this tenant type can actually serve are offered, so a
    // booking tenant is never asked for product ids it cannot have.
    const showsProducts =
        !tenantType || tenantType === "STORE" || tenantType === "HYBRID";
    const showsServices =
        !tenantType || tenantType === "BOOKING" || tenantType === "HYBRID";
    const wantedCategoryTypes = [
        ...(showsProducts ? ["PRODUCT"] : []),
        ...(showsServices ? ["SERVICE"] : []),
    ];
    const showsAnyCatalogue = wantedCategoryTypes.length > 0;

    const [productOptions, setProductOptions] = useState<PickerOption[]>([]);
    const [serviceOptions, setServiceOptions] = useState<PickerOption[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<PickerOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(showsAnyCatalogue);

    useEffect(() => {
        if (!showsAnyCatalogue) {
            setOptionsLoading(false);
            return;
        }

        let cancelled = false;
        setOptionsLoading(true);

        const toOptions = <T extends { id: string; name: string }>(
            items: T[],
        ): PickerOption[] => items.map(({ id, name }) => ({ id, name }));

        const load = async () => {
            // Independent lists: a failure in one must not blank the others, and
            // a catalogue that will not load shows as empty rather than
            // blocking the form.
            const [products, services, categories] = await Promise.all([
                showsProducts
                    ? productsService.getAll().catch(() => [] as Product[])
                    : Promise.resolve([] as Product[]),
                showsServices
                    ? servicesService.getAll().catch(() => [] as ServiceItem[])
                    : Promise.resolve([] as ServiceItem[]),
                categoriesService.getAll().catch(() => [] as Category[]),
            ]);

            if (cancelled) return;

            setProductOptions(toOptions(products));
            setServiceOptions(toOptions(services));
            setCategoryOptions(
                toOptions(
                    categories.filter((category) =>
                        wantedCategoryTypes.includes(category.type as string),
                    ),
                ),
            );
            setOptionsLoading(false);
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [
        showsProducts,
        showsServices,
        showsAnyCatalogue,
        wantedCategoryTypes.join(),
    ]);

    const toggle = (
        key:
            | "applicableProducts"
            | "applicableCategories"
            | "applicableServices",
        id: string,
    ) => {
        const current = parseIds(value[key]);
        const next = current.includes(id)
            ? current.filter((entry) => entry !== id)
            : [...current, id];
        update(key, next.join(", "));
    };

    return (
        <fieldset className="space-y-5 rounded-lg border p-5">
            <legend className="px-1 font-semibold">
                Definición de recompensa
            </legend>
            <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="reward-type">Tipo</Label>
                    <select
                        id="reward-type"
                        className={selectClassName}
                        value={value.rewardType}
                        onChange={(event) =>
                            update(
                                "rewardType",
                                event.target.value as CouponType,
                            )
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
                    <Label htmlFor="reward-max-discount">
                        Descuento máximo
                    </Label>
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
                {showsProducts && (
                    <ApplicablePicker
                        legend="Productos bonificados"
                        options={productOptions}
                        selected={parseIds(value.applicableProducts)}
                        onToggle={(id) => toggle("applicableProducts", id)}
                        isSaving={isSaving}
                        isLoading={optionsLoading}
                        emptyHint="Este tenant todavía no tiene productos cargados."
                    />
                )}
                <ApplicablePicker
                    legend="Categorías bonificadas"
                    options={categoryOptions}
                    selected={parseIds(value.applicableCategories)}
                    onToggle={(id) => toggle("applicableCategories", id)}
                    isSaving={isSaving}
                    isLoading={optionsLoading}
                    emptyHint="Este tenant todavía no tiene categorías cargadas."
                />
                {showsServices && (
                    <ApplicablePicker
                        legend="Servicios bonificados"
                        options={serviceOptions}
                        selected={parseIds(value.applicableServices)}
                        onToggle={(id) => toggle("applicableServices", id)}
                        isSaving={isSaving}
                        isLoading={optionsLoading}
                        emptyHint="Este tenant todavía no tiene servicios cargados."
                    />
                )}
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
}: LoyaltyCampaignFormProps) {
    const [value, setValue] = useState<FormValue>(() =>
        initialValue(campaign, tenantType),
    );

    const { valid, rewardValue } = validateCampaignForm(value, tenantType);

    // The backend refuses to archive a campaign before claimUntil, so a long
    // claim window silently locks the campaign. That is only discoverable by
    // hitting the 422, so it is surfaced here instead.
    const claimGraceDays = Number(value.claimGraceDays);
    const claimGraceWarning =
        Number.isFinite(claimGraceDays) && claimGraceDays > 30
            ? `La campaña no se podrá archivar hasta el ${value.claimUntil}, porque el backend solo permite archivar en o después de "Reclamable hasta".`
            : undefined;

    const update = <Key extends keyof FormValue>(
        key: Key,
        nextValue: FormValue[Key],
    ) =>
        setValue((current) => {
            const next = { ...current, [key]: nextValue };

            // claimUntil is derived from endsAt plus the grace period, so moving
            // the end of the campaign carries the claim window with it. Editing
            // the grace days does the same, which is why the two inputs cannot
            // disagree.
            if (key === "endsAt" || key === "claimGraceDays") {
                const days = Number(next.claimGraceDays);
                const computed = addDays(
                    String(next.endsAt ?? ""),
                    Number.isFinite(days) ? days : 0,
                );
                if (computed) next.claimUntil = computed;
            }

            return next;
        });

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
                claimGraceWarning={claimGraceWarning}
            />

            <CampaignRewardFields
                value={value}
                update={update}
                isSaving={isSaving}
                tenantType={tenantType}
            />

            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
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
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                )}
            </div>
        </form>
    );
}
