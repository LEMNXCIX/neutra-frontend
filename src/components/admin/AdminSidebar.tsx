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
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
            className={`hidden md:flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-16"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                {sidebarOpen ? (
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dashboard</h2>
                ) : (
                    <span className="text-xs font-bold">A</span>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="h-8 w-8 text-muted-foreground"
                >
                    {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
                </Button>
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
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={`w-full justify-start gap-3 h-11 px-3 rounded-lg transition-all ${isActive
                                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-current" : "opacity-70"}`} />
                                    {sidebarOpen && <span className="text-sm">{label}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator className="opacity-50" />

            {/* Footer */}
            <div className="p-4">
                <Link
                    href="/"
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 px-2"
                >
                    ← {sidebarOpen && "Back to Shop"}
                </Link>
            </div>
        </aside>
    );
}


