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
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

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
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md border-none shadow-xl bg-background/80 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                        <CardDescription className="text-base mt-2">
                            We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground pb-4">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setSubmitted(false)}>
                            Try another email
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center border-t py-4">
                        <Link href="/login" className="flex items-center text-sm font-medium text-primary hover:underline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md border-none shadow-xl bg-background/80 backdrop-blur-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-bold tracking-tight">Forgot password?</CardTitle>
                    <CardDescription className="text-base">
                        No worries, we'll send you reset instructions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className="h-12 pl-11 rounded-xl bg-background"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
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
        </div>
    );
}
