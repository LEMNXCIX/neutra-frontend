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
            className="fixed inset-x-0 top-0 z-50 w-full border-b bg-background/95 backdrop-blur"
        >
            <div className="max-w-7xl mx-auto w-full flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div
                        className="cursor-pointer text-foreground hover:opacity-80 transition-opacity"
                        onDoubleClick={handleThemeToggle}
                    >
                        <svg
                            className="h-8 w-8"
                            viewBox="0 0 992 1040"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M0 520v520h992V0H0zm591-342.6c0 .4-25 44.9-42.5 75.6-4.5 8-14 24.6-21 37s-20.9 36.7-30.8 54-20.8 36.4-24.2 42.5c-3.4 6-7.2 12.8-8.5 15-4.2 7.5-19.3 34-27.5 48.5-13.7 24-51.1 90.4-61.3 108.5-5.2 9.3-11.9 21.2-14.8 26.4l-5.4 9.4 3.7 4.1c2 2.2 8.2 9 13.8 15.1 5.6 6 20.9 22.7 34 37s31.5 34.3 40.9 44.5 19.8 21.4 23 25l44 48c39 42.4 47 51.1 70.8 77.4l13.7 15.1-78.2.3-78.2.3-24.5-24.9c-48.9-49.5-103.4-107-132.6-139.8-5.5-6.1-16.9-18.9-25.4-28.5-43-48.2-64.3-74-109.4-132.3-23.6-30.5-52.8-70.9-78-107.9L59.9 409h71.8c67.6 0 71.9.1 72.9 1.8.6.9 7.8 10.6 16 21.3 8.2 10.8 22.9 30.3 32.8 43.3 15.7 20.9 18 23.5 19.1 21.9.6-1 3.4-5.9 6.2-10.8 12.1-21.5 29.3-52.1 36.9-65.5 4.5-8 15.8-28 25.1-44.5 28.7-50.8 44.3-78.4 52.6-93 4.4-7.7 11.9-21 16.7-29.5s11.6-20.7 15.2-27c17.3-30.6 24.7-43.8 26.4-46.7l1.9-3.3h68.8c37.8 0 68.7.2 68.7.4m58.5 116.3c17.6 10.4 45.5 27 62 36.8s43.7 26 60.5 36c38.7 23.1 83.3 49.6 125.5 74.6l33 19.5.2 54.7.1 54.7-8.6 5.2c-4.8 2.8-18.8 11.3-31.2 18.8s-47.9 29.1-79 48-64.4 39.1-74 45-35 21.4-56.5 34.5c-21.4 13.1-45.1 27.5-52.5 32.1-7.4 4.5-14.2 8.5-15 8.9-1.1.4-2.7-1.4-5.5-6.2-5.6-9.7-30-51.1-45-76.3-9.7-16.4-12.4-21.6-11.4-22.2 5-2.9 51.4-30.6 127.9-76.5 48.7-29.1 92.9-55.6 98.4-58.8 8.5-5 9.6-5.9 8-6.8-5.3-2.9-96.3-56.2-137.9-80.7-40.7-24-79.2-46.5-87.7-51.3-4.8-2.7-9-5.3-9.4-5.8-.3-.5.3-2.4 1.4-4.2 1-1.8 14.4-24.4 29.7-50.2 15.3-25.9 28.4-48 29.2-49.3 1.3-2.1 1.6-2.2 3.6-.9 1.2.7 16.6 9.9 34.2 20.4M199 674.1c10.2 13.2 24.7 31.9 32.3 41.7 27.7 35.8 34.6 45 34 45.6-.8.8-147.8.8-148.6-.1-.4-.3-.3-1.1.2-1.7s5-8.5 10.1-17.6c5.2-9.1 11.9-21 15-26.5 40.2-71.1 36.9-65.5 37.8-65.4.4 0 9 10.8 19.2 24" fill="currentColor" />
                        </svg>
                    </div>
                    <Link href="/" className="flex flex-col leading-none">
                        <span className="text-lg font-bold tracking-tight italic">XCIX</span>
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
                                    &copy; {new Date().getFullYear()} XCIX Platforms
                                </p>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

        </NavigationMenu>
    );
}
