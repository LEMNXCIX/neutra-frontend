"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { Spinner } from "@/components/ui/spinner";
import { Mail, ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react";
import Logo from "@/components/logo";

export default function ForgotPasswordPage() {
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
            toast.success("Reset link sent if account exists");
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong");
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
                        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm animate-in zoom-in-95 duration-500">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Email Sent</CardTitle>
                        <CardDescription className="text-sm font-medium mt-1">
                            Check your inbox for reset instructions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center px-8 pb-8 space-y-6">
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            We've sent a recovery link to <span className="font-bold text-foreground">{email}</span>. 
                            If an account is associated with this address, you'll receive instructions shortly.
                        </p>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-border font-bold text-xs transition-all hover:bg-muted" onClick={() => setSubmitted(false)}>
                            Try Different Email
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-border/50 p-6 bg-muted/10">
                        <Link href="/login" className="flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Return to Sign In
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
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 transition-transform hover:scale-110 duration-500 shadow-sm">
                        <Logo size={36} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Recover Account</h1>
                        <p className="text-muted-foreground font-medium text-sm">Reset your security credentials</p>
                    </div>
                </div>

                <Card className="t-card border-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                    <CardHeader className="space-y-1 pb-6 pt-8 px-8">
                        <CardTitle className="text-xl font-bold">Password Reset</CardTitle>
                        <CardDescription className="text-sm font-medium">
                            Enter your email to receive a recovery link
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-semibold text-foreground ml-1">
                                    Email Address
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                        className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-all focus:border-primary"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all rounded-xl"
                                disabled={loading}
                            >
                                {loading ? <Spinner className="mr-2 h-4 w-4" /> : <>Send Reset Link <ArrowRight className="ml-2 h-4 w-4" /></>}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 border-t border-border/50 p-6 bg-muted/10">
                        <Link href="/login" className="flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
