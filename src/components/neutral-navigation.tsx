'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import { tenantService } from '@/services/tenant.service';
import { getTenantUrl } from '@/lib/tenant';
import { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogIn, UserPlus, Menu } from 'lucide-react';
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
        <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50 transition-colors duration-300">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onDoubleClick={handleThemeToggle}
                    >
                        <Logo size={40} className="text-foreground" />
                        <Link href="/">
                            <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">XCIX</h1>
                        </Link>
                    </div>

                    {isAdmin && (
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 text-sm font-bold hover:underline decoration-2 underline-offset-4 text-foreground"
                            >
                                <LayoutDashboard size={16} />
                                ADMINISTRACIÓN
                            </Link>
                            <div className="h-4 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tenants:</span>
                                {tenants.map(tenant => (
                                    <a
                                        key={tenant.id}
                                        href={getTenantUrl(tenant.slug)}
                                        className="px-2 py-1 text-[10px] font-bold border border-foreground hover:bg-foreground hover:text-background transition-colors uppercase text-foreground hover:no-underline"
                                    >
                                        {tenant.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <Link href="/profile" className="text-sm font-bold hover:underline underline-offset-4 text-foreground">
                                {user.name.toUpperCase()}
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-bold hover:underline underline-offset-4 flex items-center gap-1 text-foreground">
                                    <LogIn size={16} /> LOGIN
                                </Link>
                                <Link
                                    href="/register"
                                    className="hidden sm:flex px-4 py-2 bg-foreground text-background text-sm font-bold hover:opacity-80 transition items-center gap-1"
                                >
                                    <UserPlus size={16} /> GET STARTED
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
                                        <Logo size={32} />
                                        <SheetTitle className="text-xl font-black uppercase italic text-foreground">XCIX</SheetTitle>
                                    </div>
                                </SheetHeader>

                                <div className="flex flex-col h-full">
                                    <div className="flex-1 py-6 px-6 space-y-8">
                                        {/* Admin Section */}
                                        {isAdmin && (
                                            <div className="space-y-4">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Administración</span>
                                                <nav className="flex flex-col gap-2">
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-3 py-3 text-lg font-black uppercase tracking-tight hover:underline text-foreground"
                                                    >
                                                        <LayoutDashboard size={20} />
                                                        Dashboard
                                                    </Link>
                                                </nav>
                                                <div className="pt-4 space-y-3">
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Tus Sitios</span>
                                                    <div className="grid gap-2">
                                                        {tenants.map(tenant => (
                                                            <a
                                                                key={tenant.id}
                                                                href={getTenantUrl(tenant.slug)}
                                                                className="px-4 py-3 text-sm font-bold border-2 border-foreground hover:bg-foreground hover:text-background transition-colors uppercase text-center text-foreground"
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
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Cuenta</span>
                                            <nav className="flex flex-col gap-2">
                                                {user ? (
                                                    <Link
                                                        href="/profile"
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="text-lg font-black uppercase tracking-tight hover:underline text-foreground"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <Link
                                                            href="/login"
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                            className="text-lg font-black uppercase tracking-tight hover:underline text-foreground"
                                                        >
                                                            Login
                                                        </Link>
                                                        <Link
                                                            href="/register"
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                            className="text-lg font-black uppercase tracking-tight hover:underline text-foreground"
                                                        >
                                                            Register
                                                        </Link>
                                                    </>
                                                )}
                                            </nav>
                                        </div>
                                    </div>

                                    <div className="p-8 border-t border-border bg-muted/50">
                                        <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-[0.2em]">
                                            &copy; 2025 XCIX Platforms
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
