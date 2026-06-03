"use client";
import React, { use, useState } from "react";
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

type Order = {
    id: string;
    total?: number;
    date?: string;
    items?: Array<{ id?: string; name?: string; qty?: number; price?: number }>;
};

function SummaryStatsCards({
    statusCounts,
}: {
    statusCounts: Record<string, number>;
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex flex-col">
                    <span className="text-xs text-muted-foreground capitalize">
                        {status.toLowerCase()}
                    </span>
                    <span className="text-xl font-bold">{count as number}</span>
                </div>
            ))}
            {Object.keys(statusCounts).length === 0 && (
                <div className="text-sm text-muted-foreground">No data</div>
            )}
        </div>
    );
}

function AvgOrderValueCard({ value }: { value: number }) {
    return (
        <Card className="border-none shadow-md rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90 mb-1">
                            Avg Order Value
                        </p>
                        <p className="text-3xl font-bold">
                            ${value.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                        <Package className="size-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TimelineCard({
    title,
    dates,
    getDisplayValue,
    maxDisplayValue,
    valueLabel,
    valueColor,
    barGradient,
}: {
    title: string;
    dates: string[];
    getDisplayValue: (date: string, idx: number) => number;
    maxDisplayValue: number;
    valueLabel: (val: number) => string;
    valueColor: string;
    barGradient: string;
}) {
    return (
        <Card className="border-none shadow-md rounded-2xl">
            <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {dates.length ? (
                    <div className="space-y-3">
                        {dates.slice(-10).map((date) => {
                            const idx = dates.indexOf(date);
                            const value = getDisplayValue(date, idx);
                            const percentage = (value / maxDisplayValue) * 100;
                            const formattedDate = new Date(
                                date,
                            ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            });

                            return (
                                <div key={date} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {formattedDate}
                                        </span>
                                        <span
                                            className={`font-semibold ${valueColor}`}
                                        >
                                            {valueLabel(value)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-500`}
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
    );
}

const topProductColors = [
    "from-red-500 to-orange-500",
    "from-orange-500 to-amber-500",
    "from-amber-500 to-yellow-500",
    "from-emerald-500 to-green-500",
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
];

function TopProductsCard({
    topProducts,
    maxProductQty,
}: {
    topProducts: { name: string; qty: number; revenue: number }[];
    maxProductQty: number;
}) {
    return (
        <Card className="border-none shadow-md rounded-2xl">
            <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                    Top Selling Products
                </CardTitle>
            </CardHeader>
            <CardContent>
                {topProducts.length ? (
                    <div className="space-y-4">
                        {topProducts.map((data, idx) => {
                            const percentage = (data.qty / maxProductQty) * 100;

                            return (
                                <div key={data.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span
                                                className="flex-shrink-0 size-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold"
                                                style={{
                                                    background: `linear-gradient(135deg, ${
                                                        idx === 0
                                                            ? "#ef4444, #f97316"
                                                            : idx === 1
                                                              ? "#f97316, #f59e0b"
                                                              : idx === 2
                                                                ? "#f59e0b, #eab308"
                                                                : idx === 3
                                                                  ? "#10b981, #059669"
                                                                  : idx === 4
                                                                    ? "#3b82f6, #6366f1"
                                                                    : "#8b5cf6, #ec4899"
                                                    })`,
                                                }}
                                            >
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm font-medium truncate">
                                                {data.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <span className="text-xs text-muted-foreground">
                                                {data.qty} sold
                                            </span>
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                ${data.revenue.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${topProductColors[idx % topProductColors.length]} rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        No products
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchAnalytics(
    selectedRange: string,
): Promise<{ stats: any; orders: Order[] }> {
    const now = new Date();
    const startDate = new Date();

    if (selectedRange === "7d") startDate.setDate(now.getDate() - 7);
    if (selectedRange === "30d") startDate.setDate(now.getDate() - 30);
    if (selectedRange === "90d") startDate.setDate(now.getDate() - 90);
    if (selectedRange === "all") startDate.setFullYear(2000);

    const query = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        limit: "1000",
    });

    return fetch(`/api/order?${query.toString()}`, {
        credentials: "same-origin",
    })
        .then((res) => res.json().catch(() => ({})))
        .then((json) => ({
            stats: json.success ? json.stats : null,
            orders: json.success ? json.orders || [] : [],
        }));
}

export default function AnalyticsChartsDetailed() {
    const [range, setRange] = useState("7d");
    const [dataPromise, setDataPromise] = useState(() => fetchAnalytics("7d"));

    const handleRangeChange = (r: string) => {
        setRange(r);
        setDataPromise(fetchAnalytics(r));
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">
                    Order Analytics
                </h2>
                <select
                    className="bg-background border border-border rounded-lg px-4 py-1.5 text-sm"
                    value={range}
                    onChange={(e) => handleRangeChange(e.target.value)}
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                </select>
            </div>

            <React.Suspense
                fallback={
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-7 w-32" />
                            <Skeleton className="h-10 w-[180px]" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="md:col-span-2 border-none shadow-md rounded-2xl">
                                <CardHeader>
                                    <Skeleton className="h-4 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[
                                            "summary-1",
                                            "summary-2",
                                            "summary-3",
                                            "summary-4",
                                        ].map((k) => (
                                            <div key={k} className="space-y-2">
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
                                        <Skeleton className="size-10 rounded-xl" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {["timeline-1", "timeline-2"].map((k) => (
                                <Card
                                    key={k}
                                    className="border-none shadow-md rounded-2xl"
                                >
                                    <CardHeader>
                                        <Skeleton className="h-4 w-32" />
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {[
                                            "row-1",
                                            "row-2",
                                            "row-3",
                                            "row-4",
                                            "row-5",
                                        ].map((k) => (
                                            <div key={k} className="space-y-1">
                                                <div className="flex justify-between">
                                                    <Skeleton className="h-3 w-12" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                                <Skeleton className="h-2 w-full rounded-full" />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Card className="border-none shadow-md rounded-2xl">
                            <CardHeader>
                                <Skeleton className="h-4 w-40" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {["product-1", "product-2", "product-3"].map(
                                    (k) => (
                                        <div key={k} className="space-y-2">
                                            <div className="flex justify-between">
                                                <div className="flex gap-3 items-center">
                                                    <Skeleton className="size-6 rounded-full" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                                <div className="flex gap-4">
                                                    <Skeleton className="h-3 w-12" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-3 w-full rounded-full" />
                                        </div>
                                    ),
                                )}
                            </CardContent>
                        </Card>
                    </div>
                }
            >
                <AnalyticsContent dataPromise={dataPromise} />
            </React.Suspense>
        </div>
    );
}

function AnalyticsContent({
    dataPromise,
}: {
    dataPromise: Promise<{ stats: any; orders: Order[] }>;
}) {
    const data = use(dataPromise);
    const stats = data.stats;
    const orders = data.orders || [];

    const byDate = new Map<string, { count: number; revenue: number }>();
    for (const o of orders) {
        const d = o.date
            ? new Date(o.date).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10);
        const cur = byDate.get(d) || { count: 0, revenue: 0 };
        cur.count += 1;
        cur.revenue += Number(o.total || 0);
        byDate.set(d, cur);
    }
    const dates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));
    const orderCounts = dates.map((d) => byDate.get(d)!.count);
    const revenues = dates.map((d) =>
        Number(byDate.get(d)!.revenue.toFixed(2)),
    );

    const prodMap = new Map<
        string,
        { name: string; qty: number; revenue: number }
    >();
    for (const o of orders) {
        (o.items || []).forEach((it) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawName =
                (it as any).product?.name ||
                it.name ||
                (it as any).title ||
                "Unknown Product";
            const name = rawName.trim();

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
                    revenue: quantity * price,
                });
            }
        });
    }

    const topProducts = Array.from(prodMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 6);

    const maxOrderCount = Math.max(...orderCounts, 1);
    const maxRevenue = Math.max(...revenues, 1);
    const maxProductQty = topProducts.length
        ? Math.max(...topProducts.map((p) => p.qty))
        : 1;

    const totalOrders =
        stats?.totalOrders ?? orderCounts.reduce((a, b) => a + b, 0);
    const totalRevenue =
        stats?.totalRevenue ?? revenues.reduce((a, b) => a + b, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const statusCounts = stats?.statusCounts || {};

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2 border-none shadow-md rounded-2xl bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">
                            Orders by Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SummaryStatsCards statusCounts={statusCounts} />
                    </CardContent>
                </Card>
                <AvgOrderValueCard value={avgOrderValue} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimelineCard
                    title="Orders Timeline"
                    dates={dates}
                    getDisplayValue={(_, idx) => orderCounts[idx]}
                    maxDisplayValue={maxOrderCount}
                    valueLabel={(v) => `${v} orders`}
                    valueColor="text-indigo-600 dark:text-indigo-400"
                    barGradient="from-indigo-500 to-purple-500"
                />
                <TimelineCard
                    title="Revenue Timeline"
                    dates={dates}
                    getDisplayValue={(_, idx) => revenues[idx]}
                    maxDisplayValue={maxRevenue}
                    valueLabel={(v) => `$${v.toFixed(2)}`}
                    valueColor="text-emerald-600 dark:text-emerald-400"
                    barGradient="from-emerald-500 to-teal-500"
                />
            </div>

            <TopProductsCard
                topProducts={topProducts}
                maxProductQty={maxProductQty}
            />
        </>
    );
}
