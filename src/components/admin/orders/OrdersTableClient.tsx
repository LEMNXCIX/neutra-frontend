"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Order, OrderStatus } from "@/types/order.types";

type Stats = {
    totalOrders: number;
    totalRevenue: number;
    statusCounts: Record<string, number>;
};

type Props = {
    orders: Order[];
    stats: Stats;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
};

export default function OrdersTableClient({ orders, stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editingTracking, setEditingTracking] = useState("");

    // URL State
    const searchQuery = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "all";

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        router.push(`?${params.toString()}`);
    };

    const handleFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams);
        if (newFilter && newFilter !== "all") {
            params.set("status", newFilter);
        } else {
            params.delete("status");
        }
        router.push(`?${params.toString()}`);
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const error = await res.json();
                toast.error(error.error || "Failed to update status");
                return;
            }

            toast.success("Status updated");
            router.refresh();

            // Update local state for immediate feedback if dialog is open
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus as OrderStatus });
            }
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
            });

            if (!res.ok) {
                const error = await res.json();
                toast.error(error.error || "Failed to update tracking");
                return;
            }

            toast.success("Tracking updated");
            setDetailsOpen(false);
            router.refresh();
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
        switch (status) {
            case "COMPLETADO":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "ENVIADO": // Assuming ENVIADO might exist or map to something
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "PENDIENTE":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "CANCELADO":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-muted text-foreground";
        }
    };

    const calculateTotal = (order: Order) => {
        // If total is provided (extended field), use it. Otherwise calculate from items.
        // Note: The extended type definition has 'total' implicitly via 'any' or if we added it. 
        // But strictly based on types, we should calculate.
        // However, for now, let's assume items have price and amount.
        return order.items.reduce((sum, item) => sum + (item.price * item.amount), 0);
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
                    title="Pending"
                    value={stats.statusCounts.PENDIENTE || 0}
                    color="bg-yellow-500"
                />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <Select value={statusFilter} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDIENTE">Pending</SelectItem>
                                <SelectItem value="COMPLETADO">Completed</SelectItem>
                                <SelectItem value="CANCELADO">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2 flex-1">
                            <Input
                                placeholder="Search by Order ID or User ID..."
                                defaultValue={searchQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(e.currentTarget.value);
                                    }
                                }}
                                className="max-w-md"
                            />
                            <Button onClick={() => {
                                const input = document.querySelector('input[placeholder="Search by Order ID or User ID..."]') as HTMLInputElement;
                                handleSearch(input?.value || "");
                            }}>Search</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table - Desktop */}
            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <ScrollArea className="max-h-[70vh]">
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
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No orders found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((o) => {
                                        const total = calculateTotal(o);
                                        return (
                                            <TableRow key={o.id} className="hover:bg-muted/30">
                                                <TableCell className="font-medium">{o.id}</TableCell>
                                                <TableCell>{o.user?.name || o.userId}</TableCell>
                                                <TableCell>{o.items?.length || 0} items</TableCell>
                                                <TableCell className="font-semibold">${total.toFixed(2)}</TableCell>
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
                                                            <SelectItem value="PENDIENTE">Pending</SelectItem>
                                                            <SelectItem value="COMPLETADO">Completed</SelectItem>
                                                            <SelectItem value="CANCELADO">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {o.tracking || "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(o.createdAt).toLocaleDateString()}
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
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Orders - Mobile View */}
            <div className="flex flex-col gap-3 md:hidden">
                {orders.map((o) => {
                    const total = calculateTotal(o);
                    return (
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
                                    <span>{o.user?.name || o.userId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-semibold">${total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date</span>
                                    <span>{new Date(o.createdAt).toLocaleDateString()}</span>
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
                    );
                })}
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
                                    <p className="text-sm text-muted-foreground">User</p>
                                    <p className="font-medium">{selectedOrder.user?.name || selectedOrder.userId}</p>
                                    {selectedOrder.user?.email && (
                                        <p className="text-xs text-muted-foreground">{selectedOrder.user.email}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={getStatusColor(selectedOrder.status)}>
                                        {selectedOrder.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                    <p className="text-lg font-bold">${calculateTotal(selectedOrder).toFixed(2)}</p>
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
                                        <SelectItem value="PENDIENTE">Pending</SelectItem>
                                        <SelectItem value="COMPLETADO">Completed</SelectItem>
                                        <SelectItem value="CANCELADO">Cancelled</SelectItem>
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
                                                    <TableCell>{item.product?.name || item.productId}</TableCell>
                                                    <TableCell className="text-center">{item.amount}</TableCell>
                                                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ${(item.price * item.amount).toFixed(2)}
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
