"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
    Building,
    CalendarDays,
    Zap,
    Gift,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MobileAdminNav } from "@/components/admin/shared/MobileAdminNav";

const ICON_MAP: Record<string, LucideIcon> = {
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
    Gift,
};

interface SuperAdminMobileNavProps {
    items: NavItem[];
}

export default function SuperAdminMobileNav({ items }: SuperAdminMobileNavProps) {
    const pathname = usePathname();
    return <MobileAdminNav items={items} pathname={pathname} iconMap={ICON_MAP} />;
}
