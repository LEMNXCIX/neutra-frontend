"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type Order = {
  id: string;
  userId: string;
  total: number;
  status: string;
  date: string;
};

export default function OrdersAdminClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/orders", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Failed to load orders");
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-medium mb-4">Orders</h2>

      {/* === Desktop Table === */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[70vh]">
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["ID", "User", "Total", "Status", "Date"].map((th) => (
                      <TableHead key={th}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{o.id}</TableCell>
                      <TableCell>{o.userId}</TableCell>
                      <TableCell>${o.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(o.status)}>
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {o.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* === Mobile View === */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="shadow-sm border-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm flex flex-col gap-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          : orders.map((o) => (
              <Card key={o.id} className="shadow-sm border-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <span>Order #{o.id}</span>
                    <Badge className={`${getStatusColor(o.status)} text-xs`}>
                      {o.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User</span>
                    <span>{o.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">${o.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{o.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}