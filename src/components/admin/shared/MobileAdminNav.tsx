"use client";

import Link from "next/link";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { NavItem } from "@/config/admin-navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileAdminNavProps = {
  items: NavItem[];
  pathname: string;
  iconMap: Record<string, LucideIcon>;
};

export function MobileAdminNav({ items, pathname, iconMap }: MobileAdminNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border bg-background/80 backdrop-blur-md z-50 pb-[env(safe-area-inset-bottom)] shadow-lg">
      <ScrollArea className="w-full">
        <div className="flex w-max gap-1 p-2 px-4 mx-auto items-center h-16">
          {items.map(({ href, label, icon: iconName, exact }) => {
            const Icon = iconMap[iconName] || iconMap.LayoutDashboard;
            const isActive = exact ? pathname === href : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] h-12 rounded-lg transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "text-muted-foreground hover:text-foreground font-medium",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 mb-1",
                    isActive ? "opacity-100" : "opacity-70",
                  )}
                />
                <span className="text-[9px] font-medium uppercase tracking-wider leading-none">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </nav>
  );
}
