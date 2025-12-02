"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsOverview from "./AnalyticsOverview";
import AnalyticsChartsDetailed from "./AnalyticsChartsDetailed";
import UsersAdminClient from "./users/UsersTableClient";
import ProductsAdminClient from "./products/ProductsTableClient";
import OrdersAdminClient from "./orders/OrdersTableClient";
import CouponsAdminClient from "./coupons/CouponsTableClient";
import CategoriesAdminClient from "./categories/CategoriesTableClient";
import BannersAdminClient from "./banners/BannersTableClient";
import SlidersAdminClient from "./sliders/SlidersTableClient";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: LayoutList },
  { id: "banners", label: "Banners", icon: Megaphone },
  { id: "sliders", label: "Sliders", icon: Images },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "users", label: "Users", icon: Users },
];

export default function AdminShell() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row pt-2 border rounded-md overflow-hidden shadow-sm transition-all duration-300">
      {/* === SIDEBAR (solo desktop) === */}
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
            {menuItems.map(({ id, label, icon: Icon }) => {
              const activeState = id === active;
              return (
                <Button
                  key={id}
                  onClick={() => setActive(id)}
                  variant={activeState ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-2 ${activeState
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-accent/60"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {sidebarOpen && <span>{label}</span>}
                </Button>
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

      {/* === MAIN CONTENT === */}
      <main className="flex-1 p-6 overflow-y-auto pb-20 md:pb-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold capitalize">{active}</h2>
          <Button variant="ghost" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>

        {active === "dashboard" && (
          <div key={refreshKey}>
            <AnalyticsOverview />
            <AnalyticsCharts />
            <AnalyticsChartsDetailed />
          </div>
        )}
        {/* TODO: These components require props (data) which are not provided here. 
            This shell needs to fetch data or these components need to be wrapped.
            Temporarily commented out to fix build.
        
        {active === "products" && <ProductsAdminClient key={refreshKey} />}
        {active === "categories" && <CategoriesAdminClient key={refreshKey} />}
        {active === "banners" && <BannersAdminClient key={refreshKey} />}
        {active === "sliders" && <SlidersAdminClient key={refreshKey} />}
        {active === "orders" && <OrdersAdminClient key={refreshKey} />}
        {active === "coupons" && <CouponsAdminClient key={refreshKey} />}
        {active === "users" && <UsersAdminClient key={refreshKey} />} 
        */}
      </main>

      {/* === BOTTOM NAVBAR (solo móvil) === */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t bg-background/80 backdrop-blur-md shadow-md z-50 pb-[env(safe-area-inset-bottom)]">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 p-2 px-4">
            {menuItems.map(({ id, label, icon: Icon }) => {
              const activeState = id === active;
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`flex flex-col items-center text-xs min-w-[60px] ${activeState ? "text-primary" : "text-muted-foreground"
                    }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </nav>
    </div>
  );
}
