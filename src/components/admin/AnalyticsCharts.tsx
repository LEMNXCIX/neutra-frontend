"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Order = { id: string; total?: number; date?: string };

export default function AnalyticsCharts(){
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async ()=>{
    try{
      const oRes = await fetch('/api/admin/orders', { credentials: 'same-origin' });
      const o = await oRes.json();
      setOrders(o.orders || []);
    }catch{
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{ load() },[]);

  // aggregate orders by date
  const map = new Map<string, { count: number; revenue: number }>();
  for(const ord of orders){
    const d = ord.date || new Date().toISOString().slice(0,10);
    const cur = map.get(d) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(ord.total || 0);
    map.set(d, cur);
  }

  // sort dates asc
  const dates = Array.from(map.keys()).sort((a,b)=> a.localeCompare(b));
  const counts = dates.map(d => map.get(d)!.count);
  const revenues = dates.map(d => Number(map.get(d)!.revenue.toFixed(2)));

  // simple inline charts (SVG) so the page builds even if chart libs aren't installed.
  const maxCount = Math.max(...counts, 1);
  const maxRevenue = Math.max(...revenues, 1);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden border-none shadow-md rounded-2xl">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-36 w-full mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      <Card className="overflow-hidden border-none shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Orders over time</CardTitle>
        </CardHeader>
        <CardContent>
          {dates.length ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Last {dates.length} days</div>
              <div className="w-full h-36 flex items-end gap-1">
                {counts.map((v,i)=> (
                  <div key={dates[i]} title={`${dates[i]}: ${v}`} className="bg-indigo-500 rounded-sm" style={{ width: `${100 / Math.max(counts.length,1)}%`, height: `${(v/maxCount)*100}%` }} />
                ))}
              </div>
              <div className="text-sm">Total orders: <strong>{counts.reduce((s,n)=>s+n,0)}</strong></div>
            </div>
          ) : <div className="text-sm text-muted-foreground">No orders yet</div>}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Revenue over time</CardTitle>
        </CardHeader>
        <CardContent>
          {dates.length ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Last {dates.length} days</div>
              <svg viewBox={`0 0 ${Math.max(dates.length,1)} 40`} className="w-full h-36">
                <polyline
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth={0.8}
                  points={revenues.map((r,i)=> `${i},${40 - Math.round((r / maxRevenue) * 36)}`).join(' ')}
                />
              </svg>
              <div className="text-sm">Total revenue: <strong>${revenues.reduce((s,n)=>s+n,0).toFixed(2)}</strong></div>
            </div>
          ) : <div className="text-sm text-muted-foreground">No revenue yet</div>}
        </CardContent>
      </Card>
    </div>
  )
}