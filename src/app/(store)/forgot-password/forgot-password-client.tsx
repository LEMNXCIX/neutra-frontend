"use client";

import React, { useState } from "react";
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
import { Mail, ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";

export function ForgotPasswordPageClient() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            setLoading(true);
            await authService.forgotPassword(email);
            setSubmitted(true);
            toast.success("Enlace enviado si la cuenta existe");
        } catch (error: any) {
            toast.error(error?.message || "Algo salió mal");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6 animate-slide-up py-20">
                <Card className="w-full max-w-[440px] t-card border-none shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                    <CardHeader className="text-center pt-12 pb-6">
                        <div className="mx-auto size-16 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-sm animate-in zoom-in-95 duration-500">
                            <CheckCircle2 className="size-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Correo enviado
                        </CardTitle>
                        <CardDescription className="text-sm font-medium mt-1">
                            Revisá tu bandeja de entrada para ver las instrucciones
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center px-8 pb-8 space-y-6">
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Enviamos un enlace de recuperación a{" "}
                            <span className="font-bold text-foreground">
                                {email}
                            </span>
                            . Si hay una cuenta asociada a esta dirección, recibirás las instrucciones en breve.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl border-border font-bold text-xs transition-[color,background-color,border-color,box-shadow,opacity,transform] hover:bg-muted"
                            onClick={() => setSubmitted(false)}
                        >
                            Probar con otro correo
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-border/50 p-6 bg-muted/10">
                        <Link
                            href="/login"
                            className="flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="mr-2 size-4" />
                            Volver al inicio de sesión
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 animate-slide-up py-20">
            <div className="w-full max-w-[440px] space-y-8">
                {/* Logo Section */}
                <AuthBrandHeader
                    title="Recuperar cuenta"
                    subtitle="Restablecé tus credenciales de seguridad"
                />

                <Card className="t-card border-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                    <CardHeader className="space-y-1 pb-6 pt-8 px-8">
                        <CardTitle className="text-xl font-bold">
                            Restablecer contraseña
                        </CardTitle>
                        <CardDescription className="text-sm font-medium">
                            Ingresá tu correo para recibir un enlace de recuperación
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                        required
                                        className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] focus:border-primary"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-[color,background-color,border-color,box-shadow,opacity,transform] rounded-xl"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Spinner className="mr-2 size-4" />
                                ) : (
                                    <>
                                        Enviar enlace{" "}
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
            </div>
        </div>
    );
}
