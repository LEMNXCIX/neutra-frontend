"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NavItem } from "@/config/admin-navigation";
import { useFeatures } from "@/hooks/useFeatures";
import { useAuthStore } from "@/store/auth-store";
import {
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
    Building
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    Building
};

interface AdminMobileNavProps {
    items: NavItem[];
}

export default function AdminMobileNav({ items }: AdminMobileNavProps) {
    const pathname = usePathname();
    const { isFeatureEnabled } = useFeatures();
    const { user } = useAuthStore();

    const filteredItems = items.filter(item => {
        // Role check
        if (item.adminOnly && !user?.isAdmin) {
            return false;
        }

        // Feature checks
        if (item.label === "Coupons") {
            return isFeatureEnabled("COUPONS");
        }
        if (item.label === "Banners") {
            return isFeatureEnabled("BANNERS");
        }
        if (item.label === "Orders") {
            return isFeatureEnabled("ORDERS");
        }
        return true;
    });

    return (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border bg-background/80 backdrop-blur-md z-50 pb-[env(safe-area-inset-bottom)] shadow-lg">
            <ScrollArea className="w-full">
                <div className="flex w-max space-x-1 p-2 px-4 mx-auto items-center h-16">
                    {filteredItems.map(({ href, label, icon: iconName, exact }) => {
                        const Icon = ICON_MAP[iconName] || LayoutDashboard;
                        const isActive = exact
                            ? pathname === href
                            : pathname.startsWith(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[64px] h-12 rounded-lg transition-all duration-300",
                                    isActive 
                                    ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                                    : "text-muted-foreground hover:text-foreground font-medium"
                                )}
                            >
                                <Icon className={cn("w-4 h-4 mb-1", isActive ? "opacity-100" : "opacity-70")} />
                                <span className={cn(
                                    "text-[9px] font-medium uppercase tracking-wider leading-none",
                                )}>{label}</span>
                            </Link>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
        </nav>
    );
}


