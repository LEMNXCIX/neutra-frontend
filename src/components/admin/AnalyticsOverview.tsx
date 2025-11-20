"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type UsersStats = { total: number; admins: number };
type ProductsStats = { total: number; outOfStock: number };
type OrdersStats = { totalOrders: number; totalRevenue: number };

export default function AnalyticsOverview() {
  const [users, setUsers] = useState<UsersStats | null>(null);
  const [products, setProducts] = useState<ProductsStats | null>(null);
  const [orders, setOrders] = useState<OrdersStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, pRes, oRes] = await Promise.all([
          fetch('/api/admin/users', { credentials: 'same-origin' }),
          fetch('/api/admin/products', { credentials: 'same-origin' }),
          fetch('/api/admin/orders', { credentials: 'same-origin' }),
        ]);

        const uJson = await uRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ([]));
        const oJson = await oRes.json().catch(() => ({ orders: [] }));

        const uList = Array.isArray(uJson.users) ? uJson.users : [];
        const pList = Array.isArray(pJson) ? pJson : [];
        const oList = Array.isArray(oJson.orders) ? oJson.orders : [];

        const admins = uList.filter((u: any) => !!u.isAdmin).length;

        const outOfStock = pList.filter((p: any) => Number(p.stock || 0) <= 0).length;

        const totalRevenue = oList.reduce((s:any, o:any) => s + Number(o.total || 0), 0);

        setUsers({ total: uList.length, admins });
        setProducts({ total: pList.length, outOfStock });
        setOrders({ totalOrders: oList.length, totalRevenue });
      } catch (e) {
        setUsers({ total: 0, admins: 0 });
        setProducts({ total: 0, outOfStock: 0 });
        setOrders({ totalOrders: 0, totalRevenue: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1,2,3].map(i => (
          <Card key={i} className="overflow-hidden border-none shadow-md rounded-2xl">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card className="overflow-hidden border-none shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{users?.total ?? 0}</div>
          <div className="text-sm text-muted-foreground">Admins: {users?.admins ?? 0}</div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{products?.total ?? 0}</div>
          <div className="text-sm text-muted-foreground">Out of stock: {products?.outOfStock ?? 0}</div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{orders?.totalOrders ?? 0}</div>
          <div className="text-sm text-muted-foreground">Revenue: ${ (orders?.totalRevenue ?? 0).toFixed(2) }</div>
        </CardContent>
      </Card>
    </div>
  );
}
