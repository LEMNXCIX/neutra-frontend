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
        <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border bg-background/95 backdrop-blur-md z-50 pb-[env(safe-area-inset-bottom)]">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-2 p-3 px-4 mx-auto">
                    {filteredItems.map(({ href, label, icon: iconName, exact }) => {
                        const Icon = ICON_MAP[iconName] || LayoutDashboard;
                        const isActive = exact
                            ? pathname === href
                            : pathname.startsWith(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all ${isActive 
                                    ? "text-primary bg-primary/5 font-semibold" 
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mb-1 ${isActive ? "opacity-100" : "opacity-70"}`} />
                                <span className="text-[10px] uppercase tracking-wide">{label}</span>
                            </Link>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </nav>
    );
}


