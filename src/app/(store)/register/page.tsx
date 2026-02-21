"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Logo from "@/components/logo";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: '', color: '' };
    if (pass.length < 6) return { strength: 1, label: 'Weak', color: 'bg-rose-500' };
    if (pass.length < 10) return { strength: 2, label: 'Medium', color: 'bg-amber-500' };
    return { strength: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      await register(name, email, password);
      router.push('/');
    } catch (err) {
      let msg = 'Registration failed';
      if (err instanceof Error) msg = err.message;
      setError(msg);
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 animate-slide-up py-20">
      <div className="w-full max-w-[480px] space-y-8">
        {/* Logo/Brand Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 transition-transform hover:scale-110 duration-500 shadow-sm">
            <Logo size={36} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Join the Network</h1>
            <p className="text-muted-foreground font-medium text-sm">Initialize your professional profile today</p>
          </div>
        </div>

        {/* Register Card */}
        <Card className="t-card border-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Provision Account
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              Provide your details to establish your global ID
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-foreground ml-1">
                  Full Name
                </Label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-all focus:border-primary"
                    disabled={loading}
                    />
                </div>
              </div>

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
                <Label htmlFor="password" className="text-xs font-semibold text-foreground ml-1">
                  Password
                </Label>
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
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2 px-1 pt-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-500",
                            level <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Strength: <span className={cn(passwordStrength.color.replace('bg-', 'text-'))}>{passwordStrength.label}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground ml-1">
                  Confirm Password
                </Label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="h-12 pl-11 border-muted-foreground/20 rounded-xl font-medium transition-all focus:border-primary"
                    disabled={loading}
                    />
                </div>
                {confirmPassword && (
                  <div className="flex items-center gap-2 px-1 pt-1">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Passwords Match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Mismatch</span>
                      </>
                    )}
                  </div>
                )}
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
                    Provisioning...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="ml-2 h-4 w-4" />
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

              {/* Login Link */}
              <div className="text-center space-y-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Already have an account?
                </p>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl border-border font-bold text-xs transition-all hover:bg-muted"
                  asChild
                >
                  <Link href="/login">
                    Identify Session
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
    </main>
  );
}