"use client";

import type { LucideIcon } from "lucide-react";
import {
    BrickWallShield,
    Building,
    CalendarDays,
    Gift,
    Images,
    LayoutDashboard,
    LayoutList,
    Megaphone,
    Package,
    Scissors,
    ShoppingCart,
    Ticket,
    UserCog,
    Users,
    Zap,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileAdminNav } from "@/components/admin/shared/MobileAdminNav";
import type { NavItem } from "@/config/admin-navigation";

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

export default function SuperAdminMobileNav({
    items,
}: SuperAdminMobileNavProps) {
    const pathname = usePathname();
    return (
        <MobileAdminNav items={items} pathname={pathname} iconMap={ICON_MAP} />
    );
}
