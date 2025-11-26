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
    ShieldCheckIcon,
    ShieldCheck,
    BrickWallShield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

export default function AdminSidebar() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    return (
        <aside
            className={`hidden md:flex flex-col border-r bg-muted/70 backdrop-blur-md transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-16"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b">
                {sidebarOpen ? (
                    <h2 className="text-lg font-semibold">Admin</h2>
                ) : (
                    <span className="text-sm font-semibold">A</span>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="h-8 w-8"
                >
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </Button>
            </div>

            {/* Scrollable menu */}
            <ScrollArea className="flex-1">
                <nav className="p-2 flex flex-col gap-1">
                    {menuItems.map(({ href, label, icon: Icon, exact }) => {
                        const isActive = exact
                            ? pathname === href
                            : pathname.startsWith(href);

                        return (
                            <Link key={href} href={href} passHref>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={`w-full justify-start gap-2 ${isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-foreground hover:bg-accent/60"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {sidebarOpen && <span>{label}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator />

            {/* Footer */}
            <div className="p-4 text-sm">
                <Link
                    href="/"
                    className="hover:underline text-muted-foreground flex items-center gap-2"
                >
                    ← {sidebarOpen && "Back to shop"}
                </Link>
            </div>
        </aside>
    );
}
