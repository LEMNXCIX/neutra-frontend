"use client";

import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { MessageSquare, Save } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { reportError } from "@/lib/error-reporting";
import {
    applyServerErrors,
    clearFieldErrors,
    type FieldErrorSetter,
} from "@/lib/form-errors";
import {
    type WhatsAppConfig,
    whatsappService,
} from "@/services/whatsapp.service";

type WhatsAppConfigFormProps = {
    initialConfig?: Partial<WhatsAppConfig> | null;
};

const defaultConfig: Partial<WhatsAppConfig> = {
    enabled: false,
    notificationsEnabled: true,
    botEnabled: false,
    phoneNumberId: "",
    businessAccountId: "",
    accessToken: "",
    webhookVerifyToken: "",
};

const WHATSAPP_FIELDS = Object.keys(defaultConfig);

const emptySubscribe = () => () => {};
const getClientOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export function WhatsAppConfigForm({ initialConfig }: WhatsAppConfigFormProps) {
    // A missing config (404) is a valid state: show the empty form, not a spinner.
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        defaultValues: initialConfig
            ? { ...defaultConfig, ...initialConfig }
            : defaultConfig,
        onSubmit: async ({ value }) => {
            clearFieldErrors(WHATSAPP_FIELDS, setFieldServerError);
            setIsSaving(true);
            try {
                await whatsappService.updateConfig(value);
                toast.success("Configuración guardada correctamente");
                await loadConfig();
            } catch (err) {
                reportError(
                    err,
                    "No pudimos guardar la configuración de WhatsApp.",
                );
                applyServerErrors({
                    error: err,
                    fallback:
                        "No pudimos guardar la configuración de WhatsApp.",
                    knownFields: WHATSAPP_FIELDS,
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

    const config = useSelector(form.store, (state) => state.values);
    const callbackOrigin = useSyncExternalStore(
        emptySubscribe,
        getClientOrigin,
        getServerOrigin,
    );

    const loadConfig = async () => {
        try {
            setIsLoading(true);
            const data = await whatsappService.getConfig();
            if (data) {
                form.reset({
                    ...defaultConfig,
                    ...data,
                });
            }
        } catch (err) {
            console.error("Error al cargar las configuraciones", err);
            toast.error("Error al cargar la configuración de WhatsApp");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <MessageSquare className="size-6 text-green-600" />
                        <div>
                            <CardTitle>WhatsApp Business API</CardTitle>
                            <CardDescription>
                                Configurá tu integración de WhatsApp para
                                notificaciones y bots.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Status Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/20 rounded-lg">
                        <div className="flex flex-col gap-2">
                            <Label className="text-base">
                                Estado de la integración
                            </Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={config.enabled}
                                    onCheckedChange={(c) =>
                                        form.setFieldValue("enabled", c)
                                    }
                                />
                                <span className="text-sm text-muted-foreground">
                                    {config.enabled ? "Activo" : "Inactivo"}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-base">Notificaciones</Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={config.notificationsEnabled}
                                    onCheckedChange={(c) =>
                                        form.setFieldValue(
                                            "notificationsEnabled",
                                            c,
                                        )
                                    }
                                />
                                <span className="text-sm text-muted-foreground">
                                    {config.notificationsEnabled
                                        ? "Habilitado"
                                        : "Deshabilitado"}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-base">
                                Bot / Respuesta automática
                            </Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={config.botEnabled}
                                    onCheckedChange={(c) =>
                                        form.setFieldValue("botEnabled", c)
                                    }
                                />
                                <span className="text-sm text-muted-foreground">
                                    {config.botEnabled
                                        ? "Habilitado"
                                        : "Deshabilitado"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* API Credentials */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                            Credenciales de la API
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ID del número de teléfono</Label>
                                <Input
                                    value={config.phoneNumberId || ""}
                                    onChange={(e) =>
                                        form.setFieldValue(
                                            "phoneNumberId",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ej. 1045..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ID de la cuenta comercial</Label>
                                <Input
                                    value={config.businessAccountId || ""}
                                    onChange={(e) =>
                                        form.setFieldValue(
                                            "businessAccountId",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ej. 1015..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Token de acceso (permanente)</Label>
                            <PasswordInput
                                value={config.accessToken || ""}
                                onChange={(e) =>
                                    form.setFieldValue(
                                        "accessToken",
                                        e.target.value,
                                    )
                                }
                                placeholder="****************"
                            />
                            <p className="text-xs text-muted-foreground">
                                Actualízalo solo si generas un token nuevo. El
                                token anterior está oculto.
                            </p>
                        </div>
                    </div>

                    {/* Webhook Config */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">
                            Configuración del webhook
                        </h3>
                        <div className="space-y-2">
                            <Label>Token de verificación</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={config.webhookVerifyToken || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            config.webhookVerifyToken || "",
                                        );
                                        toast.success(
                                            "Copiado al portapapeles",
                                        );
                                    }}
                                >
                                    Copiar
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Usá este token en el panel de Meta: WhatsApp
                                &gt; Configuración &gt; Webhook
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>URL de callback</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={`${callbackOrigin}/api/webhooks/whatsapp`}
                                    readOnly
                                    className="bg-muted"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            `${window.location.origin}/api/webhooks/whatsapp`,
                                        );
                                        toast.success(
                                            "Copiado al portapapeles",
                                        );
                                    }}
                                >
                                    Copiar
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button
                            onClick={() => void form.handleSubmit()}
                            disabled={isSaving}
                            className="w-full md:w-auto"
                        >
                            {isSaving ? (
                                <>
                                    <Spinner className="mr-2" /> Guardando…
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2" /> Guardar
                                    configuración
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
