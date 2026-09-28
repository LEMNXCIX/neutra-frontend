"use client";

import type { LucideIcon } from "lucide-react";
import {
    BrickWallShield,
    Building,
    Clock,
    Gift,
    Images,
    LayoutDashboard,
    LayoutList,
    Megaphone,
    Package,
    Palette,
    Scissors,
    ShoppingCart,
    Ticket,
    UserCog,
    Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileAdminNav } from "@/components/admin/shared/MobileAdminNav";
import type { NavItem } from "@/config/admin-navigation";
import { useFeatures } from "@/hooks/useFeatures";
import { useAuthStore } from "@/store/auth-store";

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
    Palette,
    Clock,
    Gift,
};

interface AdminMobileNavProps {
    items: NavItem[];
}

export default function AdminMobileNav({ items }: AdminMobileNavProps) {
    const pathname = usePathname();
    const { isFeatureEnabled } = useFeatures();
    const { user } = useAuthStore();

    const filteredItems = items.filter((item) => {
        if (item.adminOnly && !user?.isAdmin) return false;

        const requiredFeatures = [
            ...(item.requiredFeature ? [item.requiredFeature] : []),
            ...(item.requiredFeatures ?? []),
        ];
        return requiredFeatures.length === 0
            ? true
            : requiredFeatures.every((feature) => isFeatureEnabled(feature));
    });

    return (
        <MobileAdminNav
            items={filteredItems}
            pathname={pathname}
            iconMap={ICON_MAP}
        />
    );
}
