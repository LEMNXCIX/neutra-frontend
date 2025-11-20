"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

type Order = { id: string; total?: number; date?: string; items?: Array<{ id?: string; name?: string; qty?: number; price?: number }> };

export default function AnalyticsChartsDetailed() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/orders', { credentials: 'same-origin' });
        const json = await res.json().catch(() => ({}));
        const o = Array.isArray(json.orders) ? json.orders : [];
        setOrders(o);
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="overflow-hidden border-none shadow-md rounded-2xl">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-36 w-full mb-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter orders based on range
  const now = new Date();
  const cutoff = new Date();
  if (range === '7d') cutoff.setDate(now.getDate() - 7);
  if (range === '30d') cutoff.setDate(now.getDate() - 30);
  if (range === '90d') cutoff.setDate(now.getDate() - 90);
  if (range === 'all') cutoff.setFullYear(2000);

  const filteredOrders = orders.filter(o => {
    const d = new Date(o.date || new Date());
    return d >= cutoff;
  });

  // aggregate by date
  const byDate = new Map<string, { count: number; revenue: number }>();
  for (const o of filteredOrders) {
    const d = o.date ? new Date(o.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const cur = byDate.get(d) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(o.total || 0);
    byDate.set(d, cur);
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));
  const orderCounts = dates.map(d => byDate.get(d)!.count);
  const revenues = dates.map(d => Number(byDate.get(d)!.revenue.toFixed(2)));

  // top products by qty
  const prodMap = new Map<string, { qty: number; revenue: number }>();
  for (const o of filteredOrders) {
    (o.items || []).forEach(it => {
      const name = it.name || (it.id || 'unknown');
      const cur = prodMap.get(name) || { qty: 0, revenue: 0 };
      cur.qty += Number(it.qty || 0);
      cur.revenue += Number((it.qty || 0) * (it.price || 0));
      prodMap.set(name, cur);
    });
  }
  const topProducts = Array.from(prodMap.entries()).sort((a, b) => b[1].qty - a[1].qty).slice(0, 6);

  const ordersData = {
    labels: dates,
    datasets: [{ label: 'Orders', data: orderCounts, borderColor: '#4f46e5', backgroundColor: '#4f46e5', tension: 0.3 }],
  };

  const revenueData = {
    labels: dates,
    datasets: [{ label: 'Revenue', data: revenues, borderColor: '#16a34a', backgroundColor: 'rgba(16,163,103,0.15)', tension: 0.3 }],
  };

  const productsData = {
    labels: topProducts.map(t => t[0]),
    datasets: [{ data: topProducts.map(t => t[1].qty), backgroundColor: ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"] }],
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-none shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Orders (by date)</CardTitle>
          </CardHeader>
          <CardContent>
            {dates.length ? <Bar data={ordersData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} height={200} /> : <div className="text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Revenue (by date)</CardTitle>
          </CardHeader>
          <CardContent>
            {dates.length ? <Line data={revenueData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} height={200} /> : <div className="text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Top Products (by qty)</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length ? <Doughnut data={productsData} options={{ maintainAspectRatio: false }} height={200} /> : <div className="text-sm text-muted-foreground">No products</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
