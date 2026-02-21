"use client";
import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Calendar, Clock, User, ArrowRight } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";

export function BookingNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const handleThemeToggle = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const navItems = [
        { label: "Services", href: "/services" },
        { label: "Book Now", href: "/book" },
    ];

    if (user) {
        navItems.push({ label: "My Appointments", href: "/appointments" });
        if (user.isAdmin) {
            navItems.push({ label: "Admin", href: "/admin" });
        }
    }

    return (
    <NavigationMenu
      viewport={false}
      className="fixed inset-x-0 top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur h-16"
    >
      <div className="max-w-7xl mx-auto w-full flex h-full items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-10">
            <div className="flex items-center gap-0">
                <div
                    className="cursor-pointer text-foreground hover-scale group"
                    onDoubleClick={handleThemeToggle}
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Logo size={36} className="relative z-10" />
                    </div>
                </div>
                <Link href="/" className="ml-3 flex flex-col leading-tight">
                    <span className="text-lg font-bold tracking-tight">XCIX</span>
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Booking Node</span>
                </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
                <NavigationMenuList className="flex gap-1">
                    {navItems.map((item) => (
                        <NavigationMenuItem key={item.href} className="list-none">
                            <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent font-semibold text-xs tracking-tight hover:bg-muted transition-colors rounded-lg px-4")}>
                                <Link href={item.href}>
                                    {item.label}
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </div>
        </div>

        <div className="flex items-center gap-4">
            {/* Auth Section */}
            <div className="hidden lg:flex items-center gap-4">
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="ml-2 outline-none">
                            <Avatar className="h-9 w-9 border border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 p-2 border border-border shadow-2xl rounded-2xl mt-2" align="end">
                            <DropdownMenuLabel className="p-4 mb-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Identity Profile</p>
                                <p className="font-bold text-sm">{user.name}</p>
                            </DropdownMenuLabel>
                            <DropdownMenuItem className="p-3 rounded-xl cursor-pointer focus:bg-muted" asChild>
                                <Link href="/appointments" className="flex items-center gap-3 font-semibold text-sm w-full">
                                    <Calendar size={16} className="opacity-70" /> Appointments
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="p-3 rounded-xl cursor-pointer focus:bg-muted" asChild>
                                <Link href="/profile" className="flex items-center gap-3 font-semibold text-sm w-full">
                                    <User size={16} className="opacity-70" /> My Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="mx-2 bg-border/50" />
                            <DropdownMenuItem className="p-3 rounded-xl cursor-pointer focus:bg-rose-500/10 text-rose-600" onClick={async () => { await logout(); router.push('/'); }}>
                                <span className="font-bold text-sm">De-authenticate</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.push('/login')} className="font-semibold text-xs">
                            Sign In
                        </Button>
                        <Button onClick={() => router.push('/book')} className="rounded-full px-6 font-bold text-xs shadow-md shadow-primary/20 h-10">
                            Book Session
                        </Button>
                    </div>
                )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-foreground hover:text-background transition-all"
                        >
                            <Menu className="stroke-[3px]" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:w-[380px] p-0 flex flex-col border-l border-border bg-background rounded-l-3xl">
                        <SheetHeader className="p-8 border-b border-border text-left bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-background border border-border shadow-sm rounded-2xl">
                                    <Logo size={32} />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-bold tracking-tight">XCIX</SheetTitle>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">Booking Node</p>
                                </div>
                            </div>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            <nav className="flex flex-col space-y-3">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Navigation</span>
                                <div className="grid gap-2">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-between p-4 bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all rounded-2xl group"
                                        >
                                            <span className="font-bold text-lg">{item.label}</span>
                                            <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </nav>

                            <div className="space-y-6 pt-10 border-t border-border">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Account</span>
                                {user ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 p-5 bg-card border border-border shadow-sm rounded-2xl">
                                            <Avatar className="h-12 w-12 border border-border">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                                    {user.name.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-bold truncate">{user.name}</p>
                                                <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-3">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between h-14 rounded-2xl px-6 font-bold text-sm"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    router.push('/appointments');
                                                }}
                                            >
                                                <span>My Appointments</span>
                                                <Calendar size={18} className="opacity-60" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between h-14 rounded-2xl px-6 font-bold text-sm"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    router.push('/profile');
                                                }}
                                            >
                                                <span>Personal Dashboard</span>
                                                <User size={18} className="opacity-60" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full h-14 rounded-2xl font-bold text-sm text-rose-600 hover:bg-rose-500/10 mt-2"
                                                onClick={async () => {
                                                    await logout();
                                                    setIsOpen(false);
                                                    router.push('/');
                                                }}
                                            >
                                                Sign Out
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 pt-2">
                                        <Button
                                            className="h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                                            onClick={() => { setIsOpen(false); router.push('/login'); }}
                                        >
                                            Sign In
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-14 rounded-2xl font-bold border-border shadow-sm"
                                            onClick={() => { setIsOpen(false); router.push('/book'); }}
                                        >
                                            Explore Services
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 border-t border-border bg-muted/20 mt-auto">
                            <p className="text-[10px] text-muted-foreground text-center font-semibold uppercase tracking-widest leading-relaxed">
                                &copy; 2026 XCIX Platforms.<br />All Rights Reserved.
                            </p>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>

    </NavigationMenu>
  );
}
