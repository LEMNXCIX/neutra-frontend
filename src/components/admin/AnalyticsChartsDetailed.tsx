"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package } from "lucide-react";

type Order = { id: string; total?: number; date?: string; items?: Array<{ id?: string; name?: string; qty?: number; price?: number }> };

export default function AnalyticsChartsDetailed() {
  const [orders, setOrders] = useState<Order[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const startDate = new Date();

        if (range === '7d') startDate.setDate(now.getDate() - 7);
        if (range === '30d') startDate.setDate(now.getDate() - 30);
        if (range === '90d') startDate.setDate(now.getDate() - 90);
        if (range === 'all') startDate.setFullYear(2000); // Far past

        const query = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          limit: '1000' // Fetch enough orders for client-side timeline if needed, or rely on stats
        });

        const res = await fetch(`/api/admin/orders?${query.toString()}`, { credentials: 'same-origin' });
        const json = await res.json().catch(() => ({}));

        if (json.success) {
          setOrders(json.orders || []);
          setStats(json.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-[180px]" />
        </div>

        {/* Summary Stats Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 border-none shadow-md rounded-2xl">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="border-none shadow-md rounded-2xl">
              <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map(j => (
                  <div key={j} className="space-y-1">
                    <div className="flex justify-between"><Skeleton className="h-3 w-12" /><Skeleton className="h-3 w-16" /></div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Products Skeleton */}
        <Card className="border-none shadow-md rounded-2xl">
          <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Aggregate orders for timeline (still useful for the graph)
  const byDate = new Map<string, { count: number; revenue: number }>();
  for (const o of orders) {
    const d = o.date ? new Date(o.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const cur = byDate.get(d) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(o.total || 0);
    byDate.set(d, cur);
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));
  const orderCounts = dates.map(d => byDate.get(d)!.count);
  const revenues = dates.map(d => Number(byDate.get(d)!.revenue.toFixed(2)));

  // Top products by Name (unify duplicates)
  const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    (o.items || []).forEach(it => {
      // Resolve name: try it.product.name first, then it.name, then fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawName = (it as any).product?.name || it.name || (it as any).title || 'Unknown Product';
      const name = rawName.trim();

      // Backend returns 'amount', frontend might expect 'qty'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quantity = Number((it as any).amount || it.qty || 0);
      const price = Number(it.price || 0);

      const existing = prodMap.get(name);
      if (existing) {
        existing.qty += quantity;
        existing.revenue += quantity * price;
      } else {
        prodMap.set(name, {
          name: name,
          qty: quantity,
          revenue: quantity * price
        });
      }
    });
  }

  const topProducts = Array.from(prodMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // Calculate max values for scaling
  const maxOrderCount = Math.max(...orderCounts, 1);
  const maxRevenue = Math.max(...revenues, 1);
  const maxProductQty = topProducts.length ? Math.max(...topProducts.map(p => p.qty)) : 1;

  // Use stats from API if available, otherwise fallback to local calc
  const totalOrders = stats?.totalOrders ?? orderCounts.reduce((a, b) => a + b, 0);
  const totalRevenue = stats?.totalRevenue ?? revenues.reduce((a, b) => a + b, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const statusCounts = stats?.statusCounts || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Analytics Detail</h2>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* New Summary: Orders by Status & Avg Value */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Breakdown */}
        <Card className="md:col-span-2 border-none shadow-md rounded-2xl bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex flex-col">
                  <span className="text-xs text-muted-foreground capitalize">{status.toLowerCase()}</span>
                  <span className="text-xl font-bold">{count as number}</span>
                </div>
              ))}
              {Object.keys(statusCounts).length === 0 && (
                <div className="text-sm text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avg Order Value */}
        <Card className="border-none shadow-md rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Avg Order Value</p>
                <p className="text-3xl font-bold">${avgOrderValue.toFixed(2)}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Timeline */}
        <Card className="border-none shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Orders Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {dates.length ? (
              <div className="space-y-3">
                {dates.slice(-10).map((date) => {
                  const count = orderCounts[dates.indexOf(date)];
                  const percentage = (count / maxOrderCount) * 100;
                  const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <div key={date} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{formattedDate}</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{count} orders</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Timeline */}
        <Card className="border-none shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Revenue Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {dates.length ? (
              <div className="space-y-3">
                {dates.slice(-10).map((date) => {
                  const revenue = revenues[dates.indexOf(date)];
                  const percentage = (revenue / maxRevenue) * 100;
                  const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <div key={date} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{formattedDate}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">${revenue.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border-none shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length ? (
            <div className="space-y-4">
              {topProducts.map((data, idx) => {
                const percentage = (data.qty / maxProductQty) * 100;
                const colors = [
                  'from-red-500 to-orange-500',
                  'from-orange-500 to-amber-500',
                  'from-amber-500 to-yellow-500',
                  'from-emerald-500 to-green-500',
                  'from-blue-500 to-indigo-500',
                  'from-purple-500 to-pink-500',
                ];

                return (
                  <div key={data.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${idx === 0 ? '#ef4444, #f97316' :
                              idx === 1 ? '#f97316, #f59e0b' :
                                idx === 2 ? '#f59e0b, #eab308' :
                                  idx === 3 ? '#10b981, #059669' :
                                    idx === 4 ? '#3b82f6, #6366f1' :
                                      '#8b5cf6, #ec4899'
                              })`
                          }}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium truncate">{data.name}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{data.qty} sold</span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">${data.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No products</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
