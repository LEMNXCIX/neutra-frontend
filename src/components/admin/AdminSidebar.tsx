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
    UserCog,
    Building,
    MessageSquare,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { NavItem } from "@/config/admin-navigation";
import { useFeatures } from "@/hooks/useFeatures";
import { useAuthStore } from "@/store/auth-store";

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
    UserCog,
    Building,
    MessageSquare
};

interface AdminSidebarProps {
    items: NavItem[];
}

export default function AdminSidebar({ items }: AdminSidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const { isFeatureEnabled } = useFeatures();
    const { user } = useAuthStore();

    // Navigation items with requiredFeature


    // Filter items based on features and roles
    const filteredItems = items.filter(item => {
        // Role check
        if (item.adminOnly && !user?.isAdmin) {
            return false;
        }

        // Feature checks (dynamic)
        if (item.requiredFeature) {
            const key = item.requiredFeature;
            console.log(key)
            console.log(isFeatureEnabled(key))
            return isFeatureEnabled(key) || isFeatureEnabled(key.toLowerCase());
        }



        return true;
    });

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out",
                sidebarOpen ? "w-64" : "w-20"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border h-16">
                {sidebarOpen ? (
                    <div className="flex flex-col leading-none">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Console</h2>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Control Center</span>
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        <span className="text-sm font-bold">X</span>
                    </div>
                )}
            </div>

            {/* Scrollable menu */}
            <ScrollArea className="flex-1">
                <nav className="p-3 flex flex-col gap-1">
                    {filteredItems.map(({ href, label, icon: iconName, exact }) => {
                        const Icon = ICON_MAP[iconName] || LayoutDashboard;
                        const isActive = exact
                            ? pathname === href
                            : pathname.startsWith(href);

                        return (
                            <Link key={href} href={href} passHref>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3 h-10 rounded-md transition-all font-medium text-xs tracking-tight",
                                        isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-70")} />
                                    {sidebarOpen && <span className="truncate">{label}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <div className="p-4 border-t border-border/50">
                <Link
                    href="/"
                    className="group flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                >
                    <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                    {sidebarOpen && "Exit to Grid"}
                </Link>
            </div>
        </aside>
    );
}


