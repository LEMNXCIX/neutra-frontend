"use client";

import React, { Suspense, useReducer, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const getStatusColor = (status: string) => {
    switch (status) {
        case "COMPLETADO":
        case "ENTREGADO":
            return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
        case "ENVIADO":
            return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
        case "PAGADO":
            return "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200";
        case "PENDIENTE":
            return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
        case "CANCELADO":
            return "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200";
        default:
            return "bg-muted text-foreground border-border";
    }
};

const calculateTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.price * item.amount, 0);
};

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
    initialStatuses?: { value: string; label: string }[];
};

const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
}: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    color: string;
}) => (
    <Card>
        <CardContent className="pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="size-6 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

function OrderDetailsDialog({
    order,
    open,
    onOpenChange,
    statuses,
    editingTracking,
    setEditingTracking,
    onUpdateStatus,
    onUpdateTracking,
    isUpdatingStatus,
    isUpdatingTracking,
}: {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    statuses: { value: string; label: string }[];
    editingTracking: string;
    setEditingTracking: (v: string) => void;
    onUpdateStatus: (orderId: string, status: string) => void;
    onUpdateTracking: (orderId: string, tracking: string) => void;
    isUpdatingStatus: string | null;
    isUpdatingTracking: boolean;
}) {
    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Order Details - {order.id}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                User
                            </p>
                            <p className="font-medium">
                                {order.user?.name || order.userId}
                            </p>
                            {order.user?.email && (
                                <p className="text-xs text-muted-foreground">
                                    {order.user.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Date
                            </p>
                            <p className="font-medium">
                                {new Date(order.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <Badge className={getStatusColor(order.status)}>
                                {order.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total
                            </p>
                            <p className="text-lg font-bold">
                                ${calculateTotal(order).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {order.address && (
                        <div>
                            <h3 className="font-semibold mb-2">
                                Shipping Address
                            </h3>
                            <p className="text-sm p-3 bg-muted/50 rounded">
                                {order.address}
                            </p>
                        </div>
                    )}

                    <div>
                        <h3 className="font-semibold mb-2">
                            Update Order Status
                        </h3>
                        <Select
                            value={order.status}
                            onValueChange={(newStatus) =>
                                onUpdateStatus(order.id, newStatus)
                            }
                            disabled={isUpdatingStatus === order.id}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Truck className="size-4" /> Tracking Number
                        </h3>
                        <div className="flex gap-2">
                            <Input
                                value={editingTracking}
                                onChange={(e) =>
                                    setEditingTracking(e.target.value)
                                }
                                placeholder="Enter tracking number..."
                            />
                            <Button
                                onClick={() =>
                                    onUpdateTracking(order.id, editingTracking)
                                }
                                disabled={isUpdatingTracking}
                            >
                                {isUpdatingTracking ? (
                                    <Spinner className="size-4" />
                                ) : (
                                    "Update"
                                )}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Order Items</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-center">
                                            Qty
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Subtotal
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items?.map((item) => (
                                        <TableRow key={item.productId}>
                                            <TableCell>
                                                {item.product?.name ||
                                                    item.productId}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.amount}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${item.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                $
                                                {(
                                                    item.price * item.amount
                                                ).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {order.coupon && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="font-semibold mb-1 text-green-900 dark:text-green-100">
                                Coupon Applied
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Code:{" "}
                                <span className="font-mono font-bold">
                                    {order.coupon.code}
                                </span>{" "}
                                (
                                {order.coupon.type === "percent"
                                    ? `${order.coupon.value}%`
                                    : `$${order.coupon.value}`}{" "}
                                off)
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Discount:{" "}
                                <span className="font-bold">
                                    -${order.coupon.discount.toFixed(2)}
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type OrdersDialogState = {
    selectedOrder: Order | null;
    detailsOpen: boolean;
    editingTracking: string;
    statuses: { value: string; label: string }[];
    isUpdatingStatus: string | null;
    isUpdatingTracking: boolean;
};

type OrdersDialogAction =
    | { type: "SET_SELECTED_ORDER"; payload: Order | null }
    | { type: "SET_DETAILS_OPEN"; payload: boolean }
    | { type: "SET_EDITING_TRACKING"; payload: string }
    | { type: "SET_STATUSES"; payload: { value: string; label: string }[] }
    | { type: "SET_IS_UPDATING_STATUS"; payload: string | null }
    | { type: "SET_IS_UPDATING_TRACKING"; payload: boolean };

function ordersDialogReducer(
    state: OrdersDialogState,
    action: OrdersDialogAction,
): OrdersDialogState {
    switch (action.type) {
        case "SET_SELECTED_ORDER":
            return { ...state, selectedOrder: action.payload };
        case "SET_DETAILS_OPEN":
            return { ...state, detailsOpen: action.payload };
        case "SET_EDITING_TRACKING":
            return { ...state, editingTracking: action.payload };
        case "SET_STATUSES":
            return { ...state, statuses: action.payload };
        case "SET_IS_UPDATING_STATUS":
            return { ...state, isUpdatingStatus: action.payload };
        case "SET_IS_UPDATING_TRACKING":
            return { ...state, isUpdatingTracking: action.payload };
        default:
            return state;
    }
}

const emptySubscribe = () => () => {};

function OrdersStats({ stats }: { stats: Stats }) {
    return (
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
    );
}

function OrdersFilters({
    statusFilter,
    searchQuery,
    statuses,
    onFilterChange,
    onSearch,
}: {
    statusFilter: string;
    searchQuery: string;
    statuses: { value: string; label: string }[];
    onFilterChange: (value: string) => void;
    onSearch: (term: string) => void;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                    <Select value={statusFilter} onValueChange={onFilterChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2 flex-1">
                        <Input
                            placeholder="Search by Order ID or User ID..."
                            defaultValue={searchQuery}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    onSearch(e.currentTarget.value);
                                }
                            }}
                            className="max-w-md"
                        />
                        <Button
                            onClick={() => {
                                const input = document.querySelector(
                                    'input[placeholder="Search by Order ID or User ID..."]',
                                ) as HTMLInputElement;
                                onSearch(input?.value || "");
                            }}
                        >
                            Search
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function OrdersDesktopTable({
    orders,
    statuses,
    isUpdatingStatus,
    updateOrderStatus,
    openOrderDetails,
    pagination,
    searchParams,
    router,
}: {
    orders: Order[];
    statuses: { value: string; label: string }[];
    isUpdatingStatus: string | null;
    updateOrderStatus: (orderId: string, newStatus: string) => void;
    openOrderDetails: (order: Order) => void;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
    searchParams: URLSearchParams;
    router: ReturnType<typeof useRouter>;
}) {
    return (
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
                                    <TableCell
                                        colSpan={8}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((o) => {
                                    const total = calculateTotal(o);
                                    return (
                                        <TableRow
                                            key={o.id}
                                            className="group hover:bg-muted/50 transition-colors border-b border-border/50"
                                        >
                                            <TableCell className="font-mono text-[10px] text-muted-foreground tracking-tighter py-4">
                                                #{o.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                                                        {(o.user?.name || "U")
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-sm">
                                                        {o.user?.name ||
                                                            o.userId}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] font-bold bg-muted/50 border-none shadow-none"
                                                >
                                                    {o.items?.length || 0} ITEMS
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-sm text-foreground">
                                                ${total.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={o.status}
                                                    onValueChange={(val) =>
                                                        updateOrderStatus(
                                                            o.id,
                                                            val,
                                                        )
                                                    }
                                                    disabled={
                                                        isUpdatingStatus ===
                                                        o.id
                                                    }
                                                >
                                                    <SelectTrigger className="w-[140px] h-8 rounded-full border border-border bg-background shadow-sm hover:bg-muted transition-colors">
                                                        {isUpdatingStatus ===
                                                        o.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Spinner className="size-3" />
                                                                <span className="text-[10px] font-semibold uppercase">
                                                                    Syncing…
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <Badge
                                                                className={cn(
                                                                    getStatusColor(
                                                                        o.status,
                                                                    ),
                                                                    "border-none shadow-none text-[9px] font-bold uppercase tracking-wider p-0 bg-transparent",
                                                                )}
                                                            >
                                                                {o.status}
                                                            </Badge>
                                                        )}
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-border shadow-xl">
                                                        {statuses.map((s) => (
                                                            <SelectItem
                                                                key={s.value}
                                                                value={s.value}
                                                                className="text-[10px] font-bold uppercase cursor-pointer rounded-lg"
                                                            >
                                                                {s.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-[10px] tracking-tight">
                                                {o.trackingNumber || "—"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-semibold text-[10px]">
                                                {new Date(
                                                    o.createdAt,
                                                ).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-3 rounded-full hover:bg-primary/10 hover:text-primary transition-all font-bold text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100"
                                                    onClick={() =>
                                                        openOrderDetails(o)
                                                    }
                                                >
                                                    <Eye className="size-3 mr-1.5" />
                                                    View
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
            {pagination.totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
                    <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        {(pagination.currentPage - 1) *
                            pagination.itemsPerPage +
                            1}{" "}
                        to{" "}
                        {Math.min(
                            pagination.currentPage * pagination.itemsPerPage,
                            pagination.totalItems,
                        )}{" "}
                        of {pagination.totalItems} results
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const params = new URLSearchParams(
                                    searchParams,
                                );
                                params.set(
                                    "page",
                                    (pagination.currentPage - 1).toString(),
                                );
                                router.push(`?${params.toString()}`);
                            }}
                            disabled={pagination.currentPage === 1}
                        >
                            Previous
                        </Button>
                        <div className="hidden sm:flex items-center gap-1">
                            <span className="text-sm text-muted-foreground px-2">
                                Page {pagination.currentPage} of{" "}
                                {pagination.totalPages}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const params = new URLSearchParams(
                                    searchParams,
                                );
                                params.set(
                                    "page",
                                    (pagination.currentPage + 1).toString(),
                                );
                                router.push(`?${params.toString()}`);
                            }}
                            disabled={
                                pagination.currentPage ===
                                    pagination.totalPages ||
                                pagination.totalPages === 0
                            }
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}

function OrdersMobileCards({
    orders,
    openOrderDetails,
}: {
    orders: Order[];
    openOrderDetails: (order: Order) => void;
}) {
    return (
        <div className="flex flex-col gap-4 md:hidden">
            {orders.length === 0 ? (
                <Card className="border-dashed t-card">
                    <CardContent className="p-12 text-center">
                        <ShoppingCart className="size-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">
                            No transactions found
                        </p>
                    </CardContent>
                </Card>
            ) : (
                orders.map((o) => {
                    const total = calculateTotal(o);
                    return (
                        <Card key={o.id} className="t-card overflow-hidden">
                            <CardHeader className="pb-4 bg-muted/10 border-b border-border/50">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                                                {(o.user?.name || "U")
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <CardTitle className="text-base font-bold">
                                                {o.user?.name || "Guest Client"}
                                            </CardTitle>
                                        </div>
                                        <p className="text-xs font-medium text-muted-foreground pl-[52px]">
                                            ID: #{o.id.slice(0, 8)}
                                        </p>
                                    </div>
                                    <Badge
                                        className={cn(
                                            getStatusColor(o.status),
                                            "border-none shadow-none text-[10px] font-semibold px-2.5 py-0.5 rounded-full",
                                        )}
                                    >
                                        {o.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="py-4 px-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Total
                                        </p>
                                        <p className="text-xl font-bold text-foreground">
                                            ${total.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Date
                                        </p>
                                        <p className="font-medium text-sm">
                                            {new Date(
                                                o.createdAt,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Tracking
                                    </p>
                                    <p className="text-xs font-mono font-medium truncate bg-muted/50 p-2 rounded-md border border-border/50">
                                        {o.trackingNumber || "No tracking info"}
                                    </p>
                                </div>
                            </CardContent>
                            <div className="px-6 pb-6 pt-2">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full h-10 rounded-lg font-semibold text-xs"
                                    onClick={() => openOrderDetails(o)}
                                >
                                    <Eye size={14} className="mr-2" /> Inspect
                                    Details
                                </Button>
                            </div>
                        </Card>
                    );
                })
            )}
        </div>
    );
}

export default function OrdersTableClient(props: Props) {
    return (
        <Suspense fallback={<div className="p-6" />}>
            <OrdersTableClientInner {...props} />
        </Suspense>
    );
}

function OrdersTableClientInner({
    orders,
    stats,
    pagination,
    initialStatuses,
}: Props) {
    const isMounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
    const router = useRouter();
    const searchParams = useSearchParams();

    const [dialogState, dispatch] = useReducer(ordersDialogReducer, {
        selectedOrder: null,
        detailsOpen: false,
        editingTracking: "",
        statuses: initialStatuses || [],
        isUpdatingStatus: null,
        isUpdatingTracking: false,
    });

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
        dispatch({ type: "SET_IS_UPDATING_STATUS", payload: orderId });
        try {
            const res = await fetch(`/api/order/${orderId}`, {
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

            if (
                dialogState.selectedOrder &&
                dialogState.selectedOrder.id === orderId
            ) {
                dispatch({
                    type: "SET_SELECTED_ORDER",
                    payload: {
                        ...dialogState.selectedOrder,
                        status: newStatus as OrderStatus,
                    },
                });
            }
        } catch {
            toast.error("Network error");
        } finally {
            dispatch({ type: "SET_IS_UPDATING_STATUS", payload: null });
        }
    };

    const updateOrderTracking = async (orderId: string, tracking: string) => {
        dispatch({ type: "SET_IS_UPDATING_TRACKING", payload: true });
        try {
            const res = await fetch(`/api/order/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackingNumber: tracking }),
            });

            if (!res.ok) {
                const error = await res.json();
                toast.error(error.error || "Failed to update tracking");
                return;
            }

            toast.success("Tracking updated");
            dispatch({ type: "SET_DETAILS_OPEN", payload: false });
            router.refresh();
        } catch {
            toast.error("Network error");
        } finally {
            dispatch({ type: "SET_IS_UPDATING_TRACKING", payload: false });
        }
    };

    const openOrderDetails = (order: Order) => {
        dispatch({ type: "SET_SELECTED_ORDER", payload: order });
        dispatch({
            type: "SET_EDITING_TRACKING",
            payload: order.trackingNumber || "",
        });
        dispatch({ type: "SET_DETAILS_OPEN", payload: true });
    };

    if (!isMounted) return null;

    return (
        <div className="w-full space-y-6" suppressHydrationWarning>
            <h2 className="text-xl font-medium">Orders Management</h2>

            <OrdersStats stats={stats} />

            <OrdersFilters
                statusFilter={statusFilter}
                searchQuery={searchQuery}
                statuses={dialogState.statuses}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
            />

            <OrdersDesktopTable
                orders={orders}
                statuses={dialogState.statuses}
                isUpdatingStatus={dialogState.isUpdatingStatus}
                updateOrderStatus={updateOrderStatus}
                openOrderDetails={openOrderDetails}
                pagination={pagination}
                searchParams={searchParams}
                router={router}
            />

            <OrdersMobileCards
                orders={orders}
                openOrderDetails={openOrderDetails}
            />

            <OrderDetailsDialog
                order={dialogState.selectedOrder}
                open={dialogState.detailsOpen}
                onOpenChange={(open) =>
                    dispatch({ type: "SET_DETAILS_OPEN", payload: open })
                }
                statuses={dialogState.statuses}
                editingTracking={dialogState.editingTracking}
                setEditingTracking={(v) =>
                    dispatch({ type: "SET_EDITING_TRACKING", payload: v })
                }
                onUpdateStatus={updateOrderStatus}
                onUpdateTracking={updateOrderTracking}
                isUpdatingStatus={dialogState.isUpdatingStatus}
                isUpdatingTracking={dialogState.isUpdatingTracking}
            />
        </div>
    );
}
