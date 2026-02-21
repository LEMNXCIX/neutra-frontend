"use client";

import React, { useEffect, useState } from "react";
import { logService } from "@/services/log.service";
import {
    Activity,
    AlertCircle,
    Clock,
    TrendingUp,
    ArrowRight,
    Search,
    RefreshCcw,
    Database,
    Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalyticsStats {
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    statusDistribution: { status: number; count: number }[];
    levelDistribution: { level: string; count: number }[];
    performance: {
        avgDuration: number;
        maxDuration: number;
    };
    topFailedEndpoints: { url: string; method: string; count: number }[];
    dailyTrend: { date: string; total: number; errors: number }[];
}

export default function LogAnalyticsDashboard() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("last_7_days");

    const loadStats = async () => {
        setLoading(true);
        try {
            const response = await logService.getStats(timeframe);
            setStats(response);
        } catch (error) {
            console.error("Error loading log stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [timeframe]);

    if (loading && !stats) {
        return (
            <div className="h-64 flex items-center justify-center border border-border border-dashed rounded-2xl animate-pulse bg-muted/30">
                <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Calculating Metrics...</span>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-12">
            {/* Control Bar */}
            <div className="flex justify-between items-center border-b border-border pb-4">
                <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" /> Operational Health
                </h3>
                <div className="flex gap-4">
                    <select
                        className="bg-background border border-border rounded-lg px-4 py-1.5 font-semibold text-[10px] outline-none focus:border-primary transition-all shadow-sm"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                    >
                        <option value="last_24h">Last 24 Hours</option>
                        <option value="last_7_days">Last 7 Days</option>
                    </select>
                    <button onClick={loadStats} className="hover:rotate-180 transition-transform duration-500 p-1.5 bg-muted rounded-lg text-muted-foreground hover:text-foreground">
                        <RefreshCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    label="Error Rate"
                    value={`${stats.errorRate.toFixed(2)}%`}
                    subtext={`${stats.errorCount} total failures`}
                    isAlert={stats.errorRate > 5}
                />
                <MetricCard
                    label="Avg Latency"
                    value={`${stats.performance.avgDuration.toFixed(0)}ms`}
                    subtext={`Max reached: ${stats.performance.maxDuration}ms`}
                />
                <MetricCard
                    label="Throughput"
                    value={stats.totalRequests.toLocaleString()}
                    subtext="Total processed events"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Daily Trend Visualizer */}
                <div className="space-y-6">
                    <h4 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2 text-muted-foreground">
                        <Activity size={14} /> Request Trend vs Errors
                    </h4>
                    <Card className="t-card p-8 space-y-8 border-none shadow-xl">
                        {stats.dailyTrend.map((day, idx) => {
                            const maxVal = Math.max(...stats.dailyTrend.map(d => d.total), 1);
                            const barWidth = (day.total / maxVal) * 100;

                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                                        <span>{new Date(day.date).toLocaleDateString()}</span>
                                        <span className="text-foreground">{day.total} REQS / <span className="text-rose-500">{day.errors} ERR</span></span>
                                    </div>
                                    <div className="h-4 w-full bg-muted rounded-full relative overflow-hidden">
                                        <div
                                            className="h-full bg-primary/40 rounded-full transition-all duration-1000"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                        <div
                                            className="absolute top-0 left-0 h-full bg-rose-500 transition-all duration-1000"
                                            style={{ width: `${(day.errors / maxVal) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </Card>
                </div>

                {/* Top Failed Endpoints */}
                <div className="space-y-6">
                    <h4 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2 text-muted-foreground">
                        <AlertCircle size={14} /> Critical Failure Points
                    </h4>
                    <div className="t-card overflow-hidden divide-y divide-border/50 border-none shadow-xl">
                        {stats.topFailedEndpoints.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground font-medium text-sm italic">
                                System stable / No errors detected
                            </div>
                        ) : (
                            stats.topFailedEndpoints.map((endpoint, idx) => (
                                <div key={idx} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="rounded-md font-mono text-[9px] bg-muted/50 border-border/50">
                                                {endpoint.method}
                                            </Badge>
                                            <span className="font-mono text-[10px] font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">{endpoint.url}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold tracking-tight text-rose-600">{endpoint.count}</span>
                                        <p className="text-[9px] font-bold uppercase text-muted-foreground">Failures</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Status Code Mix */}
                    <div className="mt-8">
                        <h4 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-4 text-muted-foreground">
                            <Database size={14} /> HTTP Distribution
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {stats.statusDistribution.map((s, idx) => (
                                <div key={idx} className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 flex flex-col items-center min-w-[90px] shadow-sm">
                                    <span className={`text-lg font-bold tracking-tight ${s.status >= 500 ? 'text-rose-600' : 'text-primary'}`}>
                                        {s.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground">{s.count} events</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, subtext, isAlert = false }: { label: string, value: string, subtext: string, isAlert?: boolean }) {
    return (
        <Card className={cn(
            "p-8 t-card border-none shadow-xl group hover:-translate-y-1",
            isAlert ? "bg-rose-50 dark:bg-rose-950/20" : "bg-card"
        )}>
            <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">{label}</span>
                {isAlert ? <AlertCircle size={20} className="text-rose-500 animate-pulse" /> : <Zap size={20} className="text-primary opacity-20 group-hover:opacity-100 transition-all" />}
            </div>
            <div className="space-y-1">
                <div className={cn(
                    "text-5xl font-bold tracking-tighter transition-transform group-hover:translate-x-1 duration-500",
                    isAlert ? "text-rose-600" : "text-foreground"
                )}>{value}</div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{subtext}</p>
            </div>
        </Card>
    );
}
