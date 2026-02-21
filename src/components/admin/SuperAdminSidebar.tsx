"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Ticket,
    Menu,
    X,
    LayoutList,
    Megaphone,
    Images,
    BrickWallShield,
    Scissors,
    UserCog,
    Building,
    CalendarDays,
    ArrowLeft,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NavItem } from "@/config/admin-navigation";

const ICON_MAP: Record<string, any> = {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Ticket,
    LayoutList,
    Megaphone,
    Images,
    BrickWallShield,
    Scissors,
    UserCog,
    Building,
    CalendarDays,
    Zap,
};

interface SuperAdminSidebarProps {
    items: NavItem[];
}

export default function SuperAdminSidebar({ items }: SuperAdminSidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    return (
        <aside
            className={`hidden md:flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out ${
                sidebarOpen ? "w-64" : "w-16"
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border h-16">
                {sidebarOpen ? (
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                        Console
                    </h2>
                ) : (
                    <span className="text-xs font-bold text-foreground mx-auto">
                        C
                    </span>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="h-8 w-8 hover:bg-muted transition-colors rounded-md"
                >
                    {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
                </Button>
            </div>

            {/* Scrollable menu */}
            <ScrollArea className="flex-1">
                <nav className="p-3 flex flex-col gap-1">
                    {items.map(({ href, label, icon: iconName, exact }) => {
                        const Icon = ICON_MAP[iconName] || LayoutDashboard;
                        const isActive = exact
                            ? pathname === href
                            : pathname.startsWith(href);

                        return (
                            <Link key={href} href={href} passHref>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={`w-full justify-start gap-3 h-10 rounded-md transition-all font-medium text-xs tracking-tight ${
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    <Icon
                                        className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-70"}`}
                                    />
                                    {sidebarOpen && (
                                        <span className="truncate">
                                            {label}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator className="opacity-10" />

            {/* Footer */}
            <div className="p-4 text-xs">
                <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground font-medium flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft size={14} /> {sidebarOpen && "Exit to Grid"}
                </Link>
            </div>
        </aside>
    );
}
