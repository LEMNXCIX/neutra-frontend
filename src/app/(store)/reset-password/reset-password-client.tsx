"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { Spinner } from "@/components/ui/spinner";
import {
    Lock,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
} from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Token de restablecimiento inválido o faltante");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        try {
            setLoading(true);
            await authService.resetPassword({ token, newPassword: password });
            setSuccess(true);
            toast.success("Contraseña restablecida correctamente");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (error: any) {
            toast.error(error?.message || "Error al restablecer la contraseña");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="w-full max-w-[440px] t-card border-none shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600" />
                <CardHeader className="text-center pt-12 pb-6">
                    <div className="mx-auto size-16 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                        <AlertCircle className="size-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Enlace inválido
                    </CardTitle>
                    <CardDescription className="text-sm font-medium mt-1">
                        Token de seguridad incorrecto
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center px-8 pb-6">
                    <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                        El token de recuperación es inválido, venció o ya fue utilizado. Solicitá un nuevo enlace para continuar.
                    </p>
                </CardContent>
                <CardFooter className="justify-center border-t border-border/50 p-8 bg-muted/10">
                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl border-border font-bold text-xs transition-[color,background-color,border-color,box-shadow,opacity,transform] hover:bg-muted"
                        asChild
                    >
                        <Link href="/forgot-password">Solicitar un nuevo enlace →</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="w-full max-w-[440px] t-card border-none shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                <CardHeader className="text-center pt-12 pb-6">
                    <div className="mx-auto size-16 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-sm animate-in zoom-in-95 duration-500">
                        <CheckCircle2 className="size-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Acceso restablecido
                    </CardTitle>
                    <CardDescription className="text-sm font-medium mt-1">
                        Protocolo de seguridad confirmado
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center px-8 pb-10">
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-8">
                        Tu contraseña se actualizó correctamente. Serás redirigido al inicio de sesión en unos instantes.
                    </p>
                    <Button
                        className="w-full h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-[color,background-color,border-color,box-shadow,opacity,transform] hover:-translate-y-0.5"
                        asChild
                    >
                        <Link href="/login">
                            Iniciar sesión <ArrowRight className="ml-2 size-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-[440px] t-card border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
            <CardHeader className="space-y-1 pb-6 pt-8 px-8">
                <CardTitle className="text-xl font-bold tracking-tight">
                    Definir nueva contraseña
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                    Configurá una contraseña segura para tu cuenta
                </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label
                            htmlFor="password"
                            className="text-xs font-semibold text-foreground ml-1"
                        >
                            Nueva contraseña
                        </Label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="password"
                                type="password"
                                required
                                className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] focus:border-primary"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="confirm-password"
                            className="text-xs font-semibold text-foreground ml-1"
                        >
                            Confirmar contraseña
                        </Label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="confirm-password"
                                type="password"
                                required
                                className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] focus:border-primary"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-[color,background-color,border-color,box-shadow,opacity,transform] rounded-xl mt-4"
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner className="mr-2 size-4" />
                        ) : (
                            <>
                                Actualizar contraseña{" "}
                                <ArrowRight className="ml-2 size-4" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-border/50 p-6 bg-muted/10">
                <Link
                    href="/login"
                    className="flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="mr-2 size-4" />
                    Volver al inicio de sesión
                </Link>
            </CardFooter>
        </Card>
    );
}

export function ResetPasswordPageClient() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 animate-slide-up py-20">
            <Suspense fallback={<Spinner className="size-12" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
