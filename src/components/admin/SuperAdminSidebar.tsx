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
    Scissors,
    UserCog,
    Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NavItem } from "@/config/admin-navigation";

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

interface SuperAdminSidebarProps {
    items: NavItem[];
}

export default function SuperAdminSidebar({ items }: SuperAdminSidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    return (
        <aside
            className={`hidden md:flex flex-col border-r-4 border-foreground bg-background transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-16"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b-2 border-foreground">
                {sidebarOpen ? (
                    <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Admin</h2>
                ) : (
                    <span className="text-sm font-black text-foreground">A</span>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="h-8 w-8 hover:bg-foreground hover:text-background transition-colors"
                >
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </Button>
            </div>

            {/* Scrollable menu */}
            <ScrollArea className="flex-1">
                <nav className="p-2 flex flex-col gap-1">
                    {items.map(({ href, label, icon: iconName, exact }) => {
                        const Icon = ICON_MAP[iconName] || LayoutDashboard;
                        const isActive = exact
                            ? pathname === href
                            : pathname.startsWith(href);

                        return (
                            <Link key={href} href={href} passHref>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-2 rounded-none border-2 transition-colors font-bold uppercase text-xs tracking-wide ${isActive
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-background text-foreground border-foreground hover:bg-foreground hover:text-background"
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

            <Separator className="bg-foreground h-[2px]" />

            {/* Footer */}
            <div className="p-4 text-sm">
                <Link
                    href="/"
                    className="hover:underline text-foreground font-bold flex items-center gap-2 uppercase text-xs tracking-wide"
                >
                    ← {sidebarOpen && "Back to Home"}
                </Link>
            </div>
        </aside>
    );
}
