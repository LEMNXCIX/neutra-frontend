"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

type OrderItem = { id: string; name: string; qty: number };
type Order = {
  id: string;
  userId: string;
  total: number;
  items: OrderItem[];
  date: string;
  status?: string;
  address?: string;
  tracking?: string;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      setIsLoadingOrders(true);
      const qp = new URLSearchParams();
      qp.set("userId", user.id);
      qp.set("page", String(page));
      qp.set("pageSize", String(pageSize));
      if (statusFilter) qp.set("status", statusFilter);
      if (dateFrom) qp.set("dateFrom", dateFrom);
      if (dateTo) qp.set("dateTo", dateTo);

      fetch(`/api/orders?${qp.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          setOrders(d.orders || []);
          setTotal(d.total || 0);
        })
        .finally(() => setIsLoadingOrders(false));
    }
  }, [user, loading, router, page, pageSize, statusFilter, dateFrom, dateTo]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );

  if (!user) return null;

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>

      <Card className="mt-4">
        <CardContent className="py-4 space-y-1 text-sm text-muted-foreground">
          <div>
            <strong>Name:</strong> {user.name}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Orders</h2>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <Button variant="default" onClick={() => setPage(1)}>
            Apply
          </Button>
        </div>

        {/* --- Skeleton Loader --- */}
        {isLoadingOrders ? (
          <ul className="mt-6 space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </ul>
        ) : orders && orders.length === 0 ? (
          <div className="p-4 text-muted-foreground">No orders found.</div>
        ) : (
          <>
            <ul className="mt-6 space-y-4">
              {orders?.map((o) => (
                <Card key={o.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">
                        Order #{o.id}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {o.date} •{" "}
                        <Badge
                          variant={
                            o.status === "delivered"
                              ? "secondary"
                              : o.status === "shipped"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {o.status || "Pending"}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">${o.total}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpanded(expanded === o.id ? null : o.id)
                        }
                      >
                        {expanded === o.id ? "Hide" : "View"}
                      </Button>
                      <Button asChild size="sm">
                        <a
                          href={`/api/orders/${o.id}/receipt`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Receipt
                        </a>
                      </Button>
                    </div>
                  </CardHeader>

                  {expanded === o.id && (
                    <CardContent className="pt-0 text-sm space-y-2">
                      <div>
                        <strong>Address:</strong> {o.address || "—"}
                      </div>
                      <div>
                        <strong>Tracking:</strong> {o.tracking || "—"}
                      </div>
                      <div>
                        <strong>Items:</strong>
                        <ul className="mt-1 ml-4 list-disc">
                          {o.items.map((it) => (
                            <li key={it.id}>
                              {it.qty}× {it.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </ul>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing {orders?.length} of {total} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <div className="px-3 py-1 text-sm">{page}</div>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
