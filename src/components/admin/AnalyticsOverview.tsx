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
  const { isFeatureEnabled } = useFeatures();

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
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && (
                trend === 'up' ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
          {isFeatureEnabled("orders") && (
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
          {isFeatureEnabled("coupons") && (
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
          {isFeatureEnabled("banners") && (
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
