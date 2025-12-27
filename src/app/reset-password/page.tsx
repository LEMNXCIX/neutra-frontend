"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { Spinner } from "@/components/ui/spinner";
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

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
            toast.error("Invalid or missing reset token");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            await authService.resetPassword({ token, newPassword: password });
            setSuccess(true);
            toast.success("Password reset successfully");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (error: any) {
            toast.error(error?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="w-full max-w-md border-none shadow-xl bg-background/80 backdrop-blur-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Invalid Request</CardTitle>
                    <CardDescription className="text-base mt-2">
                        The password reset link is invalid or has expired.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center py-6">
                    <Button variant="outline" className="w-full h-12 rounded-xl" asChild>
                        <Link href="/forgot-password">Request new link</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="w-full max-w-md border-none shadow-xl bg-background/80 backdrop-blur-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Success!</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Your password has been reset successfully. Redirecting you to login...
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-8">
                    <Button className="w-full h-12 rounded-xl" asChild>
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md border-none shadow-xl bg-background/80 backdrop-blur-xl text-foreground">
            <CardHeader className="space-y-1">
                <CardTitle className="text-3xl font-bold tracking-tight">Set new password</CardTitle>
                <CardDescription className="text-base">
                    Choose a strong password you haven't used before.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type="password"
                                required
                                className="h-12 pl-11 rounded-xl bg-background"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type="password"
                                required
                                className="h-12 pl-11 rounded-xl bg-background"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 mt-4"
                        disabled={loading}
                    >
                        {loading ? <Spinner className="mr-2 h-5 w-5" /> : "Reset password"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t py-6">
                <Link href="/login" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                </Link>
            </CardFooter>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Suspense fallback={<Spinner className="h-12 w-12" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
