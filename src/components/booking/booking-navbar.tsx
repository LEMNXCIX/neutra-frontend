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
import { Menu, X, Calendar, Clock, User } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

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
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur"
        >
            <div className="container flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div
                        className="cursor-pointer text-foreground hover:opacity-80 transition-opacity"
                        onDoubleClick={handleThemeToggle}
                    >
                        <svg
                            className="h-8 w-8"
                            viewBox="0 0 64 64"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect x="4" y="4" width="56" height="56" rx="12" fill="currentColor" opacity="0.1" />
                            <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="4" />
                            <path d="M32 12V20M32 44V52M12 32H20M44 32H52" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                    </div>
                    <Link href="/" className="flex flex-col leading-none">
                        <span className="text-lg font-bold tracking-tight">Neutra</span>
                        <span className="text-xs text-muted-foreground">Booking</span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                    <NavigationMenuList>
                        {navItems.map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href={item.href}>
                                        {item.label}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>

                    {/* Auth Section */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push('/appointments')}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <span>Appointments</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={async () => { await logout(); router.push('/'); }}>
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" onClick={() => router.push('/login')}>
                                    Sign In
                                </Button>
                                <Button onClick={() => router.push('/book')}>
                                    Get Started
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Open Menu"
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
                            <SheetHeader className="p-6 border-b text-left">
                                <SheetTitle className="text-xl font-bold">Booking Menu</SheetTitle>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Navigation</span>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <nav className="flex flex-col space-y-1">
                                    <span className="text-xs font-bold text-muted-foreground mb-3 px-4 uppercase">Main Menu</span>
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-4 py-4 text-base font-semibold transition-all duration-200 rounded-2xl hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>

                                <div className="space-y-6">
                                    <span className="text-xs font-bold text-muted-foreground px-4 uppercase">Account</span>
                                    {user ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/50 border border-border">
                                                <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                        {user.name.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold truncate text-foreground">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-12 rounded-2xl px-4 font-semibold text-foreground/80"
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        router.push('/appointments');
                                                    }}
                                                >
                                                    <Calendar className="mr-3 h-5 w-5 text-primary" />
                                                    My Appointments
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-12 rounded-2xl px-4 font-semibold text-foreground/80"
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        router.push('/profile');
                                                    }}
                                                >
                                                    <User className="mr-3 h-5 w-5 text-primary" />
                                                    My Profile
                                                </Button>
                                                <div className="pt-4 mt-4 border-t border-border">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-center h-12 rounded-2xl font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 pt-2">
                                            <Button
                                                variant="outline"
                                                className="h-14 rounded-2xl border-2 font-bold"
                                                onClick={() => { setIsOpen(false); router.push('/login'); }}
                                            >
                                                Sign In
                                            </Button>
                                            <Button
                                                className="h-14 rounded-2xl shadow-xl shadow-primary/20 font-bold text-base"
                                                onClick={() => { setIsOpen(false); router.push('/book'); }}
                                            >
                                                Start Booking
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 border-t bg-muted/20">
                                <p className="text-[10px] text-muted-foreground text-center font-medium uppercase tracking-widest">
                                    &copy; {new Date().getFullYear()} Neutra Platforms
                                </p>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

        </NavigationMenu>
    );
}
