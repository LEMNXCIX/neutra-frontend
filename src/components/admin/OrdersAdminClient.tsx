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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Package, TrendingUp, ShoppingCart, Eye, Truck } from "lucide-react";

type OrderItem = { id: string; name: string; qty: number; price: number };
type Order = {
  id: string;
  userId: string;
  total: number;
  status: string;
  tracking: string;
  address: string;
  items: OrderItem[];
  date: string;
  coupon?: {
    code: string;
    type: string;
    value: number;
    discount: number;
  };
};

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  statusCounts: Record<string, number>;
};

export default function OrdersAdminClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, statusCounts: {} });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingTracking, setEditingTracking] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Failed to load orders");
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || { totalOrders: 0, totalRevenue: 0, statusCounts: {} });
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleSearch = () => {
    load();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to update status");
        return;
      }

      toast.success("Status updated");
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const updateOrderTracking = async (orderId: string, tracking: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to update tracking");
        return;
      }

      toast.success("Tracking updated");
      setDetailsOpen(false);
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setEditingTracking(order.tracking || "");
    setDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "shipped":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "processing":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "pending":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-muted text-foreground";
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType; title: string; value: string | number; color: string }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full space-y-6">
      <h2 className="text-xl font-medium">Orders Management</h2>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={ShoppingCart}
          title="Total Orders"
          value={stats.totalOrders}
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          color="bg-green-500"
        />
        <StatCard
          icon={Package}
          title="Processing"
          value={stats.statusCounts.processing || 0}
          color="bg-yellow-500"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Search by Order ID or User ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-md"
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[70vh]">
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["ID", "User", "Items", "Total", "Status", "Date", "Actions"].map((th) => (
                      <TableHead key={th}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
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
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{o.id}</TableCell>
                      <TableCell>{o.userId}</TableCell>
                      <TableCell>{o.items?.length || 0} items</TableCell>
                      <TableCell className="font-semibold">${o.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={o.status}
                          onValueChange={(val) => updateOrderStatus(o.id, val)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <Badge className={getStatusColor(o.status)}>
                              {o.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {o.tracking || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {o.date}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openOrderDetails(o)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Orders - Mobile View */}
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
              <CardContent className="text-sm flex flex-col gap-2">
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
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => openOrderDetails(o)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-medium">{selectedOrder.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">${selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Address */}
              {selectedOrder.address && (
                <div>
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <p className="text-sm p-3 bg-muted/50 rounded">{selectedOrder.address}</p>
                </div>
              )}
              {/* Update Order Status */}
              <div>
                <h3 className="font-semibold mb-2">Update Order Status</h3>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(newStatus) => updateOrderStatus(selectedOrder.id, newStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Tracking */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Tracking Number
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={editingTracking}
                    onChange={(e) => setEditingTracking(e.target.value)}
                    placeholder="Enter tracking number..."
                  />
                  <Button
                    onClick={() => updateOrderTracking(selectedOrder.id, editingTracking)}
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-center">{item.qty}</TableCell>
                          <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.price * item.qty).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Coupon */}
              {selectedOrder.coupon && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold mb-1 text-green-900 dark:text-green-100">
                    Coupon Applied
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Code: <span className="font-mono font-bold">{selectedOrder.coupon.code}</span>
                    {" "}({selectedOrder.coupon.type === 'percent'
                      ? `${selectedOrder.coupon.value}%`
                      : `$${selectedOrder.coupon.value}`} off)
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Discount: <span className="font-bold">-${selectedOrder.coupon.discount.toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}