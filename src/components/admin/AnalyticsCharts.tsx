"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type Order = {
  id: string;
  total?: number;
  date?: string;
  status?: string;
  items?: Array<{
    id: string;
    productId?: string;
    qty?: number;
    amount?: number;
    name: string;
    price?: number;
    product?: { name: string };
  }>;
};

function TrendCard({
  title,
  icon: Icon,
  value,
  trend,
  dates,
  getBarValue,
  total,
  gradient,
  iconBg,
  iconColor,
  barColor,
  minBarHeight,
  formatBarTitle,
}: {
  title: string;
  icon: React.ElementType;
  value: string;
  trend: number;
  dates: string[];
  getBarValue: (date: string) => number;
  total: number;
  gradient: string;
  iconBg: string;
  iconColor: string;
  barColor: string;
  minBarHeight: number;
  formatBarTitle: (date: string, val: number) => string;
}) {
  return (
    <Card className={`overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br ${gradient}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`size-5 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {value}
            </span>
            {trend !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {trend > 0 ? (
                  <ArrowUpRight className="size-4" />
                ) : (
                  <ArrowDownRight className="size-4" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Compared to previous 7 days
          </p>

          <div className="w-full h-16 flex items-end gap-1">
            {dates.map((date) => {
              const dayValue = getBarValue(date);
              const height =
                total > 0 ? (dayValue / total) * 100 : 0;
              return (
                <div
                  key={date}
                  className={`flex-1 ${barColor} rounded-t opacity-60 hover:opacity-100 transition-opacity`}
                  style={{
                    height: `${Math.max(height, minBarHeight)}%`,
                  }}
                  title={formatBarTitle(date, dayValue)}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopProductsCard({ topProducts }: { topProducts: { name: string; qty: number; revenue: number }[] }) {
  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-medium">
          Top Products by Revenue
        </CardTitle>
        <Package className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {topProducts.length ? (
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.name}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span
                      className="font-medium text-sm truncate"
                      title={product.name}
                    >
                      {product.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold text-sm">
                      $
                      {product.revenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.qty} sold
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            No product sales yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  processing:
    "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  shipped:
    "bg-blue-500/10 text-blue-600 border-blue-200",
  delivered:
    "bg-green-500/10 text-green-600 border-green-200",
  cancelled:
    "bg-red-500/10 text-red-600 border-red-200",
};

function RecentOrdersCard({ recentOrders }: { recentOrders: Order[] }) {
  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-medium">
          Recent Orders
        </CardTitle>
        <ShoppingCart className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {recentOrders.length ? (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const statusColor =
                statusColors[
                  order.status || "processing"
                ] ||
                "bg-gray-500/10 text-gray-600 border-gray-200";

              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-sm truncate">
                      Order #{order.id}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${statusColor}`}
                    >
                      {order.status || "pending"}
                    </span>
                    <p className="font-semibold text-sm whitespace-nowrap">
                      $
                      {(order.total || 0).toFixed(
                        2,
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            No recent orders
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type AnalyticsChartsProps = {
  initialOrders?: Order[];
};

export default function AnalyticsCharts({ initialOrders }: AnalyticsChartsProps = {}) {
  const orders = initialOrders || [];
  const loading = !initialOrders;

  const ordersByDate = new Map<string, { count: number; revenue: number }>();
  for (const ord of orders) {
    const d = ord.date || new Date().toISOString().slice(0, 10);
    const cur = ordersByDate.get(d) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(ord.total || 0);
    ordersByDate.set(d, cur);
  }

  const sortedDates = Array.from(ordersByDate.keys())
    .sort((a, b) => a.localeCompare(b))
    .slice(-30);

  const last7Days = sortedDates.slice(-7);
  const prev7Days = sortedDates.slice(-14, -7);

  const last7Revenue = last7Days.reduce(
    (sum, d) => sum + (ordersByDate.get(d)?.revenue || 0),
    0,
  );
  const prev7Revenue = prev7Days.reduce(
    (sum, d) => sum + (ordersByDate.get(d)?.revenue || 0),
    0,
  );
  const revenueTrend =
    prev7Revenue > 0
      ? ((last7Revenue - prev7Revenue) / prev7Revenue) * 100
      : 0;

  const last7Orders = last7Days.reduce(
    (sum, d) => sum + (ordersByDate.get(d)?.count || 0),
    0,
  );
  const prev7Orders = prev7Days.reduce(
    (sum, d) => sum + (ordersByDate.get(d)?.count || 0),
    0,
  );
  const ordersTrend =
    prev7Orders > 0 ? ((last7Orders - prev7Orders) / prev7Orders) * 100 : 0;

  const productSales = new Map<
    string,
    { name: string; qty: number; revenue: number }
  >();
  for (const ord of orders) {
    for (const item of ord.items || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productId = (item as any).productId || item.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qty = (item as any).amount || item.qty || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = (item as any).price || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name =
        (item as any).product?.name || item.name || "Unknown Product";

      const current = productSales.get(productId) || {
        name,
        qty: 0,
        revenue: 0,
      };
      current.qty += qty;
      current.revenue += qty * price;
      productSales.set(productId, current);
    }
  }
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const recentOrders = orders
    .toSorted((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {["skeleton-1", "skeleton-2"].map((k) => (
            <Card
              key={k}
              className="overflow-hidden border-none shadow-md"
            >
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-36 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Details</h2>
        <Badge variant="outline" className="text-sm">
          Last 30 days
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrendCard
          title="Weekly Revenue"
          icon={DollarSign}
          value={`$${last7Revenue.toFixed(0)}`}
          trend={revenueTrend}
          dates={last7Days}
          getBarValue={(d) => ordersByDate.get(d)?.revenue || 0}
          total={last7Revenue}
          gradient="from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
          iconBg="bg-green-500/10"
          iconColor="text-green-600 dark:text-green-400"
          barColor="bg-green-500"
          minBarHeight={5}
          formatBarTitle={(d, v) => `${d}: $${v.toFixed(2)}`}
        />
        <TrendCard
          title="Weekly Orders"
          icon={ShoppingCart}
          value={`${last7Orders}`}
          trend={ordersTrend}
          dates={last7Days}
          getBarValue={(d) => ordersByDate.get(d)?.count || 0}
          total={last7Orders}
          gradient="from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          barColor="bg-blue-500"
          minBarHeight={10}
          formatBarTitle={(d, v) => `${d}: ${v} orders`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsCard topProducts={topProducts} />
        <RecentOrdersCard recentOrders={recentOrders} />
      </div>
    </div>
  );
}