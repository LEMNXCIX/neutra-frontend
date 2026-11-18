"use client";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Lock,
    Mail,
    User,
    UserPlus,
} from "lucide-react";
import { useState } from "react";
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
import { firstErrorCode } from "@/lib/error-messages";
import {
    applyServerErrors,
    clearFieldErrors,
    type FieldErrorSetter,
    inlineFieldErrors,
} from "@/lib/form-errors";
import { useRouter } from "@/lib/navigation";
import { PASSWORD_MIN_LENGTH } from "@/lib/password-policy";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

/**
 * The one backend code the forgot-password link is for: the email is already
 * registered in another tenant, so the user has a password from that other
 * sign-up and the recovery flow is the way back into it.
 */
const RECOVERY_LINK_CODE = "AUTH_EMAIL_TAKEN_IN_OTHER_TENANT";

const REGISTER_FIELDS = [
    "name",
    "email",
    "password",
    "confirmPassword",
] as const;

const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: "", color: "" };
    if (pass.length < PASSWORD_MIN_LENGTH)
        return { strength: 1, label: "Débil", color: "bg-rose-500" };
    if (pass.length < 10)
        return { strength: 2, label: "Media", color: "bg-amber-500" };
    return { strength: 3, label: "Fuerte", color: "bg-emerald-500" };
};

/**
 * The three client-side rules, in the same order they were checked before the
 * form moved to TanStack Form. Returning the message from a validator keeps the
 * copy in one place: it is shown in the alert and blocks `onSubmit`.
 */
const validateRegistration = (value: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}): string | undefined => {
    if (
        !value.name ||
        !value.email ||
        !value.password ||
        !value.confirmPassword
    ) {
        return "Por favor completa todos los campos";
    }
    if (value.password !== value.confirmPassword) {
        return "Las contraseñas no coinciden";
    }
    if (value.password.length < PASSWORD_MIN_LENGTH) {
        return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
    }
    return undefined;
};

export function RegisterPageClient() {
    const register = useAuthStore((state) => state.register);
    const loading = useAuthStore((state) => state.loading);
    const [serverError, setServerError] = useState("");
    const [errorCode, setErrorCode] = useState("");
    const router = useRouter();

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validators: {
            onSubmit: ({ value }) => validateRegistration(value),
        },
        onSubmit: async ({ value }) => {
            clearErrors();
            try {
                await register(value.name, value.email, value.password);
                router.push("/");
            } catch (err) {
                setErrorCode(firstErrorCode(err) ?? "");
                applyServerErrors({
                    error: err,
                    fallback: "No pudimos crear tu cuenta.",
                    knownFields: REGISTER_FIELDS,
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

    const clearErrors = () => {
        setServerError("");
        setErrorCode("");
        form.setErrorMap({ ...form.state.errorMap, onSubmit: undefined });
        clearFieldErrors(REGISTER_FIELDS, setFieldServerError);
    };

    // Form state is read through the form store so the derived strength meter
    // and the "passwords match" hint re-render as the user types, the same way
    // the old reducer-driven `state.password` did.
    const password = useSelector(form.store, (state) => state.values.password);
    const confirmPassword = useSelector(
        form.store,
        (state) => state.values.confirmPassword,
    );
    const passwordStrength = getPasswordStrength(password);

    const submitError = useSelector(
        form.store,
        (state) => state.errorMap.onSubmit,
    );
    const validationMessage =
        serverError || (typeof submitError === "string" ? submitError : "");

    const fieldErrorProps = (
        errors: readonly unknown[],
    ): { invalid: boolean; errors: string[] } => ({
        invalid: errors.length > 0,
        errors: inlineFieldErrors(errors, validationMessage),
    });

    return (
        <main className="min-h-[80vh] flex items-center justify-center p-6 animate-slide-up py-20">
            <div className="w-full max-w-[480px] space-y-8">
                {/* Logo/Brand Section */}
                <AuthBrandHeader
                    title="Únete a la red"
                    subtitle="Inicializa tu perfil profesional hoy"
                />

                {/* Register Card */}
                <Card className="t-card border-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                    <CardHeader className="space-y-1 pb-6 pt-8">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <UserPlus className="size-5 text-primary" />
                            Crear cuenta
                        </CardTitle>
                        <CardDescription className="text-sm font-medium">
                            Ingresa tus datos para crear tu identidad global
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
                            {/* Name Field */}
                            <form.Field name="name">
                                {(field) => {
                                    const { invalid, errors } = fieldErrorProps(
                                        field.state.meta.errors,
                                    );
                                    return (
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="name"
                                                className="text-xs font-semibold text-foreground ml-1"
                                            >
                                                Nombre completo
                                            </Label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="name"
                                                    placeholder="Juan Pérez"
                                                    value={field.state.value}
                                                    onChange={(e) => {
                                                        clearErrors();
                                                        field.handleChange(
                                                            e.target.value,
                                                        );
                                                    }}
                                                    onBlur={field.handleBlur}
                                                    aria-invalid={
                                                        invalid || undefined
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

                            {/* Email Field */}
                            <form.Field name="email">
                                {(field) => {
                                    const { invalid, errors } = fieldErrorProps(
                                        field.state.meta.errors,
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
                                                    onChange={(e) => {
                                                        clearErrors();
                                                        field.handleChange(
                                                            e.target.value,
                                                        );
                                                    }}
                                                    onBlur={field.handleBlur}
                                                    aria-invalid={
                                                        invalid || undefined
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

                            {/* Password Field */}
                            <form.Field name="password">
                                {(field) => {
                                    const { invalid, errors } = fieldErrorProps(
                                        field.state.meta.errors,
                                    );
                                    return (
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="password"
                                                className="text-xs font-semibold text-foreground ml-1"
                                            >
                                                Contraseña
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                icon={Lock}
                                                placeholder="••••••••"
                                                value={field.state.value}
                                                onChange={(e) => {
                                                    clearErrors();
                                                    field.handleChange(
                                                        e.target.value,
                                                    );
                                                }}
                                                onBlur={field.handleBlur}
                                                aria-invalid={
                                                    invalid || undefined
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
                                            {/* Password Strength Indicator */}
                                            {password && (
                                                <div className="space-y-2 px-1 pt-1">
                                                    <div className="flex gap-1.5">
                                                        {[1, 2, 3].map(
                                                            (level) => (
                                                                <div
                                                                    key={level}
                                                                    className={cn(
                                                                        "h-1 flex-1 rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-500",
                                                                        level <=
                                                                            passwordStrength.strength
                                                                            ? passwordStrength.color
                                                                            : "bg-muted",
                                                                    )}
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                    {passwordStrength.label && (
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                            Seguridad:{" "}
                                                            <span
                                                                className={cn(
                                                                    passwordStrength.color.replace(
                                                                        "bg-",
                                                                        "text-",
                                                                    ),
                                                                )}
                                                            >
                                                                {
                                                                    passwordStrength.label
                                                                }
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }}
                            </form.Field>

                            {/* Confirm Password Field */}
                            <form.Field name="confirmPassword">
                                {(field) => {
                                    const { invalid, errors } = fieldErrorProps(
                                        field.state.meta.errors,
                                    );
                                    return (
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="confirmPassword"
                                                className="text-xs font-semibold text-foreground ml-1"
                                            >
                                                Confirmar contraseña
                                            </Label>
                                            <PasswordInput
                                                id="confirmPassword"
                                                icon={Lock}
                                                placeholder="••••••••"
                                                value={field.state.value}
                                                onChange={(e) => {
                                                    clearErrors();
                                                    field.handleChange(
                                                        e.target.value,
                                                    );
                                                }}
                                                onBlur={field.handleBlur}
                                                aria-invalid={
                                                    invalid || undefined
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
                                            {confirmPassword && (
                                                <div className="flex items-center gap-2 px-1 pt-1">
                                                    {password ===
                                                    confirmPassword ? (
                                                        <>
                                                            <CheckCircle2 className="size-3 text-emerald-500" />
                                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                                                Las contraseñas
                                                                coinciden
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="size-3 text-rose-500" />
                                                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                                                                No coinciden
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }}
                            </form.Field>

                            {/* Error Alert */}
                            {validationMessage && (
                                <Alert
                                    variant="destructive"
                                    className="border-none bg-destructive/10 text-destructive rounded-xl py-3"
                                >
                                    <AlertCircle className="size-4" />
                                    <AlertDescription className="text-xs font-semibold">
                                        {validationMessage}
                                    </AlertDescription>
                                    {/* Scoped to the one code the recovery path was written for. Every other
        failure here — the form's own validation, or a different backend code —
        leaves the user with no password to recover, so offering the link
        would point them at a flow that cannot help. */}
                                    {errorCode === RECOVERY_LINK_CODE && (
                                        <Link
                                            to="/forgot-password"
                                            className="mt-1 inline-block text-xs font-semibold underline underline-offset-2"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    )}
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-[color,background-color,border-color,box-shadow,opacity,transform] rounded-xl"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Creando cuenta…
                                    </>
                                ) : (
                                    <>
                                        Crear cuenta{" "}
                                        <ArrowRight className="ml-2 size-4" />
                                    </>
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="relative py-2">
                                <Separator className="bg-border" />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    O
                                </span>
                            </div>

                            {/* Login Link */}
                            <div className="text-center space-y-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                    ¿Ya tienes una cuenta?
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-border font-bold text-xs transition-[color,background-color,border-color,box-shadow,opacity,transform] hover:bg-muted"
                                    asChild
                                >
                                    <Link to="/login">Identificar Sesión</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-[10px] font-medium text-muted-foreground opacity-60">
                    PROTEGIDO POR XCIX CRYPTOGRAPHY • 2026
                </p>
            </div>
        </main>
    );
}
