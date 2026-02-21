"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Ticket,
  ImageIcon,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useApiQuery } from "@/hooks/use-api";
import { useFeatures } from "@/hooks/useFeatures";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Stats = {
  users: { total: number; admins: number; regular: number };
  products: { total: number; totalValue: number; lowStock: number; outOfStock: number };
  orders: { total: number; revenue: number; avgOrderValue: number };
  coupons: { total: number; active: number; used: number };
  sliders: { total: number; active: number; withImages: number };
  banners: { total: number; active: number };
  categories: { total: number; avgProducts: number };
};

export default function AnalyticsOverview() {
  const [isMounted, setIsMounted] = React.useState(false);
  const { isFeatureEnabled } = useFeatures();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: stats, isLoading: loading } = useApiQuery<Stats>(
    ['admin', 'stats', 'overview'],
    '/admin/stats/overview'
  );

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
    trend,
  }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    trend?: 'up' | 'down';
  }) => (
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:translate-y-[-2px]">
      <div className={cn("absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity", color)} />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tighter">{value}</p>
              {trend && (
                <Badge variant="outline" className={cn(
                  "px-1 py-0 border-none flex items-center gap-0.5 font-bold text-[10px]",
                  trend === 'up' ? "text-green-600" : "text-red-600"
                )}>
                  {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend === 'up' ? "+12%" : "-5%"}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs font-medium text-muted-foreground/70 tracking-tight">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-500", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-9 w-64 rounded-lg" />

        {/* Primary Metrics - 4 cards */}
        <div>
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Inventory Status - 3 cards */}
        <div>
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Marketing & Promotions - 4 cards */}
        <div>
          <Skeleton className="h-5 w-56 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Management - 3 cards */}
        <div>
          <Skeleton className="h-5 w-44 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Overview</h2>

      {/* Primary Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Primary Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isFeatureEnabled("ORDERS") && (
            <>
              <StatCard
                icon={ShoppingCart}
                title="Total Orders"
                value={stats.orders.total}
                subtitle={`$${stats.orders.revenue.toFixed(2)} revenue`}
                color="bg-blue-500"
                trend="up"
              />
              <StatCard
                icon={DollarSign}
                title="Total Revenue"
                value={`$${stats.orders.revenue.toFixed(2)}`}
                subtitle={`Avg: $${stats.orders.avgOrderValue.toFixed(2)}/order`}
                color="bg-green-500"
                trend="up"
              />
            </>
          )}
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.users.total}
            subtitle={`${stats.users.admins} admins, ${stats.users.regular} users`}
            color="bg-purple-500"
          />
          <StatCard
            icon={Package}
            title="Total Products"
            value={stats.products.total}
            subtitle={`$${stats.products.totalValue.toFixed(2)} inventory value`}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Inventory & Stock */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Inventory Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={AlertTriangle}
            title="Low Stock Items"
            value={stats.products.lowStock}
            subtitle="Products below 10 units"
            color="bg-yellow-500"
          />
          <StatCard
            icon={Package}
            title="Out of Stock"
            value={stats.products.outOfStock}
            subtitle="Needs restocking"
            color="bg-red-500"
          />
          <StatCard
            icon={Package}
            title="Total Categories"
            value={stats.categories.total}
            subtitle={`Avg ${stats.categories.avgProducts.toFixed(1)} products/category`}
            color="bg-indigo-500"
          />
        </div>
      </div>

      {/* Marketing & Promotions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Marketing & Promotions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isFeatureEnabled("COUPONS") && (
            <>
              <StatCard
                icon={Ticket}
                title="Coupons"
                value={stats.coupons.total}
                subtitle={`${stats.coupons.active} active, ${stats.coupons.used} used`}
                color="bg-pink-500"
              />
              <StatCard
                icon={Ticket}
                title="Active Coupons"
                value={stats.coupons.active}
                subtitle="Available for use"
                color="bg-green-500"
              />
            </>
          )}
          <StatCard
            icon={ImageIcon}
            title="Sliders"
            value={stats.sliders.total}
            subtitle={`${stats.sliders.active} active, ${stats.sliders.withImages} with images`}
            color="bg-cyan-500"
          />
          {isFeatureEnabled("BANNERS") && (
            <StatCard
              icon={Ticket}
              title="Banners"
              value={stats.banners.total}
              subtitle={`${stats.banners.active} active`}
              color="bg-teal-500"
            />
          )}
        </div>
      </div>

      {/* User Management */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">User Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={Shield}
            title="Administrators"
            value={stats.users.admins}
            subtitle="System admins"
            color="bg-purple-500"
          />
          <StatCard
            icon={Users}
            title="Regular Users"
            value={stats.users.regular}
            subtitle="Customer accounts"
            color="bg-gray-500"
          />
          <StatCard
            icon={Users}
            title="Admin Ratio"
            value={`${stats.users.total > 0 ? ((stats.users.admins / stats.users.total) * 100).toFixed(1) : 0}%`}
            subtitle="Percentage of admins"
            color="bg-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
