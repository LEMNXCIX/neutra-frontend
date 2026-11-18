"use client";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import {
    AlertCircle,
    ArrowRight,
    Loader2,
    Lock,
    LogIn,
    Mail,
} from "lucide-react";
import { Suspense, useState } from "react";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import {
    applyServerErrors,
    clearFieldErrors,
    type FieldErrorSetter,
    inlineFieldErrors,
} from "@/lib/form-errors";
import { useRouter, useSearchParams } from "@/lib/navigation";
import { useAuthStore } from "@/store/auth-store";

const LOGIN_FIELDS = ["email", "password"] as const;

export function LoginForm() {
    const login = useAuthStore((state) => state.login);
    const loading = useAuthStore((state) => state.loading);
    const _user = useAuthStore((state) => state.user);
    const [serverError, setServerError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/";

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        validators: {
            onSubmit: ({ value }) => {
                if (!value.email || !value.password) {
                    return "Por favor completa todos los campos";
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            setServerError("");
            clearFieldErrors(LOGIN_FIELDS, setFieldServerError);

            try {
                await login(value.email, value.password);
                router.push(redirectTo);
            } catch (err) {
                // The backend sends a machine-readable code; the envelope message is
                // its own and can be English, so neither is shown as-is.
                applyServerErrors({
                    error: err,
                    fallback: "No pudimos iniciar sesión. Inténtalo de nuevo.",
                    knownFields: LOGIN_FIELDS,
                    setFormError: setServerError,
                    setFieldError: setFieldServerError,
                });
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

    const submitError = useSelector(
        form.store,
        (state) => state.errorMap.onSubmit,
    );
    const validationMessage =
        serverError || (typeof submitError === "string" ? submitError : "");

    return (
        <div className="w-full max-w-[440px] space-y-8">
            <AuthBrandHeader
                title="Bienvenido de Nuevo"
                subtitle="Acceso seguro a tu cuenta"
            />

            <Card className="t-card border-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <CardHeader className="space-y-1 pb-6 pt-8">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <LogIn className="size-5 text-primary" />
                        Iniciar sesión
                    </CardTitle>
                    <CardDescription className="text-sm font-medium">
                        Ingresa tus credenciales para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void form.handleSubmit();
                        }}
                        className="space-y-5"
                    >
                        <form.Field name="email">
                            {(field) => {
                                const hasErrors =
                                    field.state.meta.errors.length > 0;
                                const errors = inlineFieldErrors(
                                    field.state.meta.errors,
                                    validationMessage,
                                );
                                return (
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="email"
                                            className="text-xs font-semibold text-foreground ml-1"
                                        >
                                            Correo Electrónico
                                        </Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="juan@ejemplo.com"
                                                value={field.state.value}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                onBlur={field.handleBlur}
                                                aria-invalid={
                                                    hasErrors || undefined
                                                }
                                                className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] focus:border-primary"
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.length > 0 && (
                                            <p
                                                role="alert"
                                                className="px-1 text-xs font-semibold text-destructive"
                                            >
                                                {errors.join(" ")}
                                            </p>
                                        )}
                                    </div>
                                );
                            }}
                        </form.Field>

                        <form.Field name="password">
                            {(field) => {
                                const hasErrors =
                                    field.state.meta.errors.length > 0;
                                const errors = inlineFieldErrors(
                                    field.state.meta.errors,
                                    validationMessage,
                                );
                                return (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label
                                                htmlFor="password"
                                                className="text-xs font-semibold text-foreground ml-1"
                                            >
                                                Contraseña
                                            </Label>
                                            <Link
                                                to="/forgot-password"
                                                className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                                            >
                                                ¿Te olvidaste?
                                            </Link>
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            icon={Lock}
                                            placeholder="••••••••"
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            aria-invalid={
                                                hasErrors || undefined
                                            }
                                            className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] focus:border-primary"
                                            disabled={loading}
                                        />
                                        {errors.length > 0 && (
                                            <p
                                                role="alert"
                                                className="px-1 text-xs font-semibold text-destructive"
                                            >
                                                {errors.join(" ")}
                                            </p>
                                        )}
                                    </div>
                                );
                            }}
                        </form.Field>

                        {validationMessage && (
                            <Alert
                                variant="destructive"
                                className="border-none bg-destructive/10 text-destructive rounded-xl py-3"
                            >
                                <AlertCircle className="size-4" />
                                <AlertDescription className="text-xs font-semibold">
                                    {validationMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-[color,background-color,border-color,box-shadow,opacity,transform] rounded-xl"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Autenticando…
                                </>
                            ) : (
                                <>
                                    Iniciar sesión{" "}
                                    <ArrowRight className="ml-2 size-4" />
                                </>
                            )}
                        </Button>

                        <div className="relative py-2">
                            <Separator className="bg-border" />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                O
                            </span>
                        </div>

                        <div className="text-center space-y-4">
                            <p className="text-xs font-medium text-muted-foreground">
                                ¿Aún no tienes una cuenta?
                            </p>
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl border-border font-bold text-xs transition-[color,background-color,border-color,box-shadow,opacity,transform] hover:bg-muted"
                                asChild
                            >
                                <Link to="/register">Crear Nueva Cuenta</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <p className="text-center text-[10px] font-medium text-muted-foreground opacity-60">
                PROTEGIDO POR XCIX CRYPTOGRAPHY • 2026
            </p>
        </div>
    );
}

export function LoginPageClient() {
    return (
        <main className="min-h-[80vh] flex items-center justify-center p-6 animate-slide-up py-20">
            <Suspense fallback={<Loader2 className="size-8 animate-spin" />}>
                <LoginForm />
            </Suspense>
        </main>
    );
}
