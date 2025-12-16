"use client";
import React, { useEffect, useState } from 'react';
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
  items?: Array<{ id: string; productId?: string; qty?: number; amount?: number; name: string; price?: number; product?: { name: string } }>;
};

// type Product = {
//   id: string;
//   name: string;
//   stock?: number;
//   price?: number;
// };

export default function AnalyticsCharts() {
  const [orders, setOrders] = useState<Order[]>([]);
  // const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [ordersRes] = await Promise.all([
        fetch('/api/admin/orders', { credentials: 'same-origin' }),
        // fetch('/api/admin/products', { credentials: 'same-origin' }),
      ]);

      const ordersData = await ordersRes.json();
      // const productsData = await productsRes.json();

      setOrders(ordersData.orders || []);
      // setProducts(productsData.products || []);
    } catch {
      setOrders([]);
      // setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load() }, []);

  // Aggregate orders by date
  const ordersByDate = new Map<string, { count: number; revenue: number }>();
  for (const ord of orders) {
    const d = ord.date || new Date().toISOString().slice(0, 10);
    const cur = ordersByDate.get(d) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(ord.total || 0);
    ordersByDate.set(d, cur);
  }

  // Sort dates and get last 30 days
  const sortedDates = Array.from(ordersByDate.keys()).sort((a, b) => a.localeCompare(b)).slice(-30);
  // const orderCounts = sortedDates.map(d => ordersByDate.get(d)!.count);
  // const revenues = sortedDates.map(d => Number(ordersByDate.get(d)!.revenue.toFixed(2)));

  // Calculate trends (compare last 7 days with previous 7 days)
  const last7Days = sortedDates.slice(-7);
  const prev7Days = sortedDates.slice(-14, -7);

  const last7Revenue = last7Days.reduce((sum, d) => sum + (ordersByDate.get(d)?.revenue || 0), 0);
  const prev7Revenue = prev7Days.reduce((sum, d) => sum + (ordersByDate.get(d)?.revenue || 0), 0);
  const revenueTrend = prev7Revenue > 0 ? ((last7Revenue - prev7Revenue) / prev7Revenue * 100) : 0;

  const last7Orders = last7Days.reduce((sum, d) => sum + (ordersByDate.get(d)?.count || 0), 0);
  const prev7Orders = prev7Days.reduce((sum, d) => sum + (ordersByDate.get(d)?.count || 0), 0);
  const ordersTrend = prev7Orders > 0 ? ((last7Orders - prev7Orders) / prev7Orders * 100) : 0;

  // Top selling products (by quantity sold)
  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const ord of orders) {
    for (const item of ord.items || []) {
      // Use productId if available, otherwise fallback to id (which might be productId in some contexts, but usually is orderItemId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productId = (item as any).productId || item.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qty = (item as any).amount || item.qty || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = (item as any).price || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (item as any).product?.name || item.name || 'Unknown Product';

      const current = productSales.get(productId) || { name, qty: 0, revenue: 0 };
      current.qty += qty;
      current.revenue += qty * price;
      productSales.set(productId, current);
    }
  }
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Recent activity
  const recentOrders = [...orders]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 6);

  // const maxOrderCount = Math.max(...orderCounts, 1);
  // const maxRevenue = Math.max(...revenues, 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden border-none shadow-md">
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

      {/* Trend Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-muted-foreground">Weekly Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">${last7Revenue.toFixed(0)}</span>
                {revenueTrend !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${revenueTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueTrend > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(revenueTrend).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Compared to previous 7 days</p>

              {/* Mini chart */}
              <div className="w-full h-16 flex items-end gap-1">
                {last7Days.map((date) => {
                  const dayRevenue = ordersByDate.get(date)?.revenue || 0;
                  const height = last7Revenue > 0 ? (dayRevenue / last7Revenue) * 100 : 0;
                  return (
                    <div
                      key={date}
                      className="flex-1 bg-green-500 rounded-t opacity-60 hover:opacity-100 transition-opacity"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${date}: $${dayRevenue.toFixed(2)}`}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Trend */}
        <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-muted-foreground">Weekly Orders</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{last7Orders}</span>
                {ordersTrend !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${ordersTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ordersTrend > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(ordersTrend).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Compared to previous 7 days</p>

              {/* Mini chart */}
              <div className="w-full h-16 flex items-end gap-1">
                {last7Days.map((date) => {
                  const dayOrders = ordersByDate.get(date)?.count || 0;
                  const height = last7Orders > 0 ? (dayOrders / last7Orders) * 100 : 0;
                  return (
                    <div
                      key={date}
                      className="flex-1 bg-blue-500 rounded-t opacity-60 hover:opacity-100 transition-opacity"
                      style={{ height: `${Math.max(height, 10)}%` }}
                      title={`${date}: ${dayOrders} orders`}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium">Top Products by Revenue</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topProducts.length ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm truncate" title={product.name}>
                          {product.name}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-sm">${product.revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{product.qty} sold</p>
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

        {/* Recent Orders */}
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium">Recent Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentOrders.length ? (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const statusColors: Record<string, string> = {
                    processing: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
                    shipped: 'bg-blue-500/10 text-blue-600 border-blue-200',
                    delivered: 'bg-green-500/10 text-green-600 border-green-200',
                    cancelled: 'bg-red-500/10 text-red-600 border-red-200',
                  };
                  const statusColor = statusColors[order.status || 'processing'] || 'bg-gray-500/10 text-gray-600 border-gray-200';

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      {/* IZQUIERDA: Order ID + fecha (se trunca si es muy largo) */}
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-medium text-sm truncate">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
                      </div>

                      {/* DERECHA: Badge + Precio (nunca se superponen) */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${statusColor}`}
                        >
                          {order.status || 'pending'}
                        </span>
                        <p className="font-semibold text-sm whitespace-nowrap">
                          ${(order.total || 0).toFixed(2)}
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
      </div>
    </div>
  );
}