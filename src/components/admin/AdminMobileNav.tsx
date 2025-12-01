"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
} from "lucide-react";

const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: LayoutList },
    { href: "/admin/banners", label: "Banners", icon: Megaphone },
    { href: "/admin/sliders", label: "Sliders", icon: Images },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/roles", label: "Roles", icon: BrickWallShield },
];

export default function AdminMobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t bg-background/80 backdrop-blur-md shadow-md z-50 pb-[env(safe-area-inset-bottom)]">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 p-2 px-4">
                    {menuItems.map(({ href, label, icon: Icon, exact }) => {
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
