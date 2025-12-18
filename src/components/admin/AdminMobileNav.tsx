"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NavItem } from "@/config/admin-navigation";
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

    return (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t bg-background/80 backdrop-blur-md shadow-md z-50 pb-[env(safe-area-inset-bottom)]">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 p-2 px-4">
                    {items.map(({ href, label, icon: iconName, exact }) => {
                        const Icon = ICON_MAP[iconName] || LayoutDashboard;
                        const isActive = exact
                            ? pathname === href
                            : pathname.startsWith(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center text-xs min-w-[60px] ${isActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                <Icon className="w-5 h-5 mb-1" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </nav>
    );
}


