"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { LogIn, Mail, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Logo from "@/components/logo";

function LoginForm() {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  // If user is already logged in, redirect them
  React.useEffect(() => {
    if (user && !loading) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err) {
      let msg = 'Login failed';
      if (err instanceof Error) msg = err.message;
      setError(msg);
    }
  }

  return (
    <div className="w-full max-w-[440px] space-y-8">
      {/* Logo/Brand Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 transition-transform hover:scale-110 duration-500 shadow-sm">
          <Logo size={36} />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground font-medium text-sm">Secure access to your account</p>
        </div>
      </div>

      {/* Login Card */}
      <Card className="t-card border-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
        <CardHeader className="space-y-1 pb-6 pt-8">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            Sign In
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email Field */}
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-all focus:border-primary"
                  disabled={loading}
                  />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground ml-1">
                  Password
                  </Label>
                  <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                  >
                  Forgot?
                  </Link>
              </div>
              <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-all focus:border-primary"
                  disabled={loading}
                  />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="border-none bg-destructive/10 text-destructive rounded-xl py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative py-2">
              <Separator className="bg-border" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                OR
              </span>
            </div>

            {/* Register Link */}
            <div className="text-center space-y-4">
              <p className="text-xs font-medium text-muted-foreground">
                Don't have an account yet?
              </p>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-border font-bold text-xs transition-all hover:bg-muted"
                asChild
              >
                <Link href="/register">
                  Create New Account
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-[10px] font-medium text-muted-foreground opacity-60">
        SECURED BY XCIX CRYPTOGRAPHY • 2026
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 animate-slide-up py-20">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}