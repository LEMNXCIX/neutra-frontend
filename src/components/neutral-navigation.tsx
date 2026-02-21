'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import { tenantService } from '@/services/tenant.service';
import { getTenantUrl } from '@/lib/tenant';
import { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogIn, UserPlus, Menu, Building2 } from 'lucide-react';
import { useTenant } from '@/context/tenant-context';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import Logo from '@/components/logo';

export function NeutralNavigation() {
    const { theme, setTheme } = useTheme();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.isAdmin;
    const { tenantSlug } = useTenant();
    const isSuperAdminContext = tenantSlug === 'superadmin';

    const handleThemeToggle = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    useEffect(() => {
        if (isAdmin) {
            const fetchTenants = async () => {
                try {
                    const data = await tenantService.getAll();
                    setTenants(data || []);
                } catch (error) {
                    console.error('Error fetching tenants:', error);
                }
            };
            fetchTenants();
        }
    }, [isAdmin]);

    return (
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center h-20">
                <div className="flex items-center gap-10">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onDoubleClick={handleThemeToggle}
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Logo size={40} className="text-foreground relative z-10 transition-transform group-hover:scale-110 duration-300" />
                        </div>
                        <Link href="/">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">XCIX</h1>
                        </Link>
                    </div>

                    {isAdmin && (
                        <div className="hidden lg:flex items-center gap-6">
                            <a
                                href={`${getTenantUrl('superadmin')}/admin`}
                                className="flex items-center gap-2 text-xs font-semibold hover:text-primary transition-colors text-foreground uppercase tracking-wider"
                            >
                                <LayoutDashboard size={14} />
                                Control Center
                            </a>
                            <div className="h-4 w-px bg-border" />
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Network:</span>
                                <div className="flex gap-2">
                                    {tenants.map(tenant => (
                                        <a
                                            key={tenant.id}
                                            href={getTenantUrl(tenant.slug)}
                                            className="px-3 py-1 text-[10px] font-semibold border border-border rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-foreground"
                                        >
                                            {tenant.name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isAdmin && user && isSuperAdminContext && (
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/onboarding/tenant"
                                className="flex items-center gap-2 text-xs font-semibold hover:text-primary transition-colors text-foreground uppercase tracking-wider"
                            >
                                <Building2 size={16} />
                                Launch Instance
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-6">
                        {user ? (
                            <Link href="/profile" className="text-xs font-semibold hover:text-primary transition-colors text-foreground uppercase tracking-wider">
                                {user.name}
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-xs font-semibold hover:text-primary transition-colors flex items-center gap-2 text-foreground uppercase tracking-wider">
                                    <LogIn size={14} /> Access
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-all uppercase tracking-wider shadow-sm"
                                >
                                    Join Network
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden">
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-foreground">
                                    <Menu size={24} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] bg-background border-l border-border p-0">
                                <SheetHeader className="p-6 border-b border-border text-left bg-background">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer"
                                        onDoubleClick={handleThemeToggle}
                                    >
                                        <Logo size={28} />
                                        <SheetTitle className="text-xl font-bold tracking-tight text-foreground">XCIX</SheetTitle>
                                    </div>
                                </SheetHeader>

                                <div className="flex flex-col h-full">
                                    <div className="flex-1 py-6 px-6 space-y-8">
                                        {/* Admin Section */}
                                        {isAdmin && (
                                            <div className="space-y-4">
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">Administración</span>
                                                <nav className="flex flex-col gap-1">
                                                    <a
                                                        href={`${getTenantUrl('superadmin')}/admin`}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-3 py-2 text-sm font-medium hover:text-primary transition-colors text-foreground"
                                                    >
                                                        <LayoutDashboard size={18} />
                                                        Dashboard
                                                    </a>
                                                </nav>
                                                <div className="pt-2 space-y-3">
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">Sitios</span>
                                                    <div className="grid gap-1">
                                                        {tenants.map(tenant => (
                                                            <a
                                                                key={tenant.id}
                                                                href={getTenantUrl(tenant.slug)}
                                                                className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
                                                            >
                                                                {tenant.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Auth Section */}
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">Cuenta</span>
                                            <nav className="flex flex-col gap-1">
                                                {user ? (
                                                    <Link
                                                        href="/profile"
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="py-2 text-sm font-medium hover:text-primary transition-colors text-foreground"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <Link
                                                            href="/login"
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                            className="py-2 text-sm font-medium hover:text-primary transition-colors text-foreground"
                                                        >
                                                            Login
                                                        </Link>
                                                        <Link
                                                            href="/register"
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                            className="py-2 text-sm font-medium hover:text-primary transition-colors text-foreground"
                                                        >
                                                            Register
                                                        </Link>
                                                    </>
                                                )}
                                            </nav>
                                        </div>
                                    </div>

                                    <div className="p-8 border-t border-border bg-muted/20">
                                        <p className="text-[10px] text-muted-foreground text-center font-medium uppercase tracking-[0.1em]">
                                            &copy; 2026 XCIX Platforms
                                        </p>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}
