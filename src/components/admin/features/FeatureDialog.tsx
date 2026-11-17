"use client";

import { useForm } from "@tanstack/react-form";
import { DollarSign, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { reportError } from "@/lib/error-reporting";
import {
    applyServerErrors,
    clearFieldErrors,
    type FieldErrorSetter,
} from "@/lib/form-errors";
import {
    type CreateFeatureData,
    featuresService,
    type PlatformFeature,
} from "@/services/features.service";

interface FeatureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feature?: PlatformFeature | null;
    onSuccess: () => void;
}

const FEATURE_FIELDS = [
    "name",
    "key",
    "description",
    "category",
    "price",
] as const;

const valuesFrom = (feature?: PlatformFeature | null): CreateFeatureData => ({
    name: feature?.name || "",
    key: feature?.key || "",
    description: feature?.description || "",
    category: feature?.category || "General",
    price: feature?.price || 0,
});

export function FeatureDialog({
    open,
    onOpenChange,
    feature,
    onSuccess,
}: FeatureDialogProps) {
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        defaultValues: valuesFrom(feature),
        validators: {
            onSubmit: ({ value }) => {
                if (!value.name || !value.key) {
                    return "Nombre y clave son obligatorios";
                }
                return undefined;
            },
        },
        onSubmitInvalid: () => {
            toast.error("Nombre y clave son obligatorios");
        },
        onSubmit: async ({ value }) => {
            clearFieldErrors(FEATURE_FIELDS, setFieldServerError);
            setIsSaving(true);
            try {
                if (feature) {
                    await featuresService.update(feature.id, value);
                    toast.success("Función actualizada");
                } else {
                    await featuresService.create(value);
                    toast.success("Función creada");
                }
                onSuccess();
                onOpenChange(false);
            } catch (err) {
                reportError(err, "No pudimos guardar la función.");
                applyServerErrors({
                    error: err,
                    fallback: "No pudimos guardar la función.",
                    knownFields: FEATURE_FIELDS,
                    setFormError: () => {},
                    setFieldError: setFieldServerError,
                });
            } finally {
                setIsSaving(false);
            }
        },
    });

    const setFieldServerError: FieldErrorSetter = (field, message) =>
        form.setFieldMeta(field as never, (prev) => ({
            ...prev,
            errorMap: {
                ...prev?.errorMap,
                onServer: message,
            },
        }));

    useEffect(() => {
        if (!open) return;
        form.reset(valuesFrom(feature));
    }, [open, feature, form]);

    const renderFieldError = (errors: readonly unknown[]) =>
        errors.filter(
            (error): error is string =>
                typeof error === "string" && error.length > 0,
        );

    return (
        <Dialog
            key={feature?.id ?? "new"}
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="size-5 text-yellow-500" />
                        {feature ? "Editar Función" : "Crear Función"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field name="name">
                            {(field) => {
                                const errors = renderFieldError(
                                    field.state.meta.errors,
                                );
                                return (
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={field.state.value}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                const key =
                                                    !feature &&
                                                    !field.form.state.values.key
                                                        ? name
                                                              .toUpperCase()
                                                              .replace(
                                                                  /[^A-Z0-9]/g,
                                                                  "_",
                                                              )
                                                              .replace(
                                                                  /_+/g,
                                                                  "_",
                                                              )
                                                        : field.form.state
                                                              .values.key;
                                                field.handleChange(name);
                                                field.form.setFieldValue(
                                                    "key",
                                                    key,
                                                );
                                            }}
                                            onBlur={field.handleBlur}
                                            aria-invalid={
                                                errors.length > 0 || undefined
                                            }
                                            placeholder="Analíticas Avanzadas"
                                        />
                                        {errors.length > 0 && (
                                            <p
                                                role="alert"
                                                className="text-xs font-semibold text-destructive"
                                            >
                                                {errors.join(" ")}
                                            </p>
                                        )}
                                    </div>
                                );
                            }}
                        </form.Field>
                        <form.Field name="key">
                            {(field) => {
                                const errors = renderFieldError(
                                    field.state.meta.errors,
                                );
                                return (
                                    <div className="space-y-2">
                                        <Label>Key (Internal)</Label>
                                        <Input
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            aria-invalid={
                                                errors.length > 0 || undefined
                                            }
                                            placeholder="ADVANCED_ANALYTICS"
                                            disabled={!!feature}
                                        />
                                        {errors.length > 0 && (
                                            <p
                                                role="alert"
                                                className="text-xs font-semibold text-destructive"
                                            >
                                                {errors.join(" ")}
                                            </p>
                                        )}
                                    </div>
                                );
                            }}
                        </form.Field>
                    </div>

                    <form.Field name="category">
                        {(field) => (
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input
                                    value={field.state.value}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    onBlur={field.handleBlur}
                                    placeholder="Ej.: Analítica, Marketing, Soporte"
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="price">
                        {(field) => (
                            <div className="space-y-2">
                                <Label>Precio mensual</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        className="pl-9"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(
                                                Number.parseFloat(
                                                    e.target.value,
                                                ) || 0,
                                            )
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="description">
                        {(field) => (
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={field.state.value}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    onBlur={field.handleBlur}
                                    placeholder="Describe qué habilita esta función..."
                                    rows={3}
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => void form.handleSubmit()}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Spinner className="mr-2" /> Guardando…
                            </>
                        ) : (
                            "Guardar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
