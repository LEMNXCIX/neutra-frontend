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
            <div className="h-64 flex items-center justify-center border-4 border-foreground animate-pulse">
                <span className="font-black uppercase tracking-[0.5em] italic">Calculating Metrics...</span>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-12">
            {/* Control Bar */}
            <div className="flex justify-between items-center border-b-2 border-foreground pb-4">
                <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                    <TrendingUp size={16} /> Operational Health
                </h3>
                <div className="flex gap-4">
                    <select
                        className="bg-background border-2 border-foreground px-4 py-1 font-bold uppercase text-[10px] outline-none"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                    >
                        <option value="last_24h">Last 24 Hours</option>
                        <option value="last_7_days">Last 7 Days</option>
                    </select>
                    <button onClick={loadStats} className="hover:rotate-180 transition-transform duration-500">
                        <RefreshCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-foreground bg-foreground divide-y-4 md:divide-y-0 md:divide-x-4 divide-foreground">
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
                {/* Daily Trend Visualizer (Simple BW ASCII-ish style) */}
                <div className="space-y-6">
                    <h4 className="font-black uppercase tracking-[0.3em] text-xs flex items-center gap-2">
                        <Activity size={14} /> Request Trend vs Errors
                    </h4>
                    <div className="border-4 border-foreground p-8 space-y-8">
                        {stats.dailyTrend.map((day, idx) => {
                            const maxVal = Math.max(...stats.dailyTrend.map(d => d.total), 1);
                            const barWidth = (day.total / maxVal) * 100;
                            const errorRatio = day.total > 0 ? (day.errors / day.total) : 0;
                            const errorWidth = (day.errors / maxVal) * 100;

                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                        <span>{new Date(day.date).toLocaleDateString()}</span>
                                        <span>{day.total} REQS / {day.errors} ERR</span>
                                    </div>
                                    <div className="h-6 w-full border-2 border-foreground relative overflow-hidden bg-background">
                                        <div
                                            className="h-full bg-foreground transition-all duration-1000"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                        <div
                                            className="absolute top-0 left-0 h-full bg-red-600/50 mix-blend-multiply transition-all duration-1000"
                                            style={{ width: `${(day.errors / maxVal) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Failed Endpoints */}
                <div className="space-y-6">
                    <h4 className="font-black uppercase tracking-[0.3em] text-xs flex items-center gap-2">
                        <AlertCircle size={14} /> Critical Failure Points
                    </h4>
                    <div className="border-4 border-foreground divide-y-2 divide-foreground">
                        {stats.topFailedEndpoints.length === 0 ? (
                            <div className="p-12 text-center opacity-30 font-black uppercase text-xs italic">
                                System stable / No errors detected
                            </div>
                        ) : (
                            stats.topFailedEndpoints.map((endpoint, idx) => (
                                <div key={idx} className="p-4 flex justify-between items-center group hover:bg-foreground hover:text-background transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className="rounded-none bg-foreground text-background font-black text-[9px] group-hover:bg-background group-hover:text-foreground">
                                                {endpoint.method}
                                            </Badge>
                                            <span className="font-mono text-[10px] break-all max-w-[300px] truncate">{endpoint.url}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black italic">{endpoint.count}</span>
                                        <p className="text-[9px] font-bold uppercase opacity-50">Failures</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Status Code Mix */}
                    <div className="mt-8">
                        <h4 className="font-black uppercase tracking-[0.3em] text-xs flex items-center gap-2 mb-4">
                            <Database size={14} /> HTTP Distribution
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {stats.statusDistribution.map((s, idx) => (
                                <div key={idx} className="border-2 border-foreground px-4 py-2 flex flex-col items-center min-w-[80px]">
                                    <span className={`text-lg font-black italic ${s.status >= 500 ? 'text-red-600 decoration-red-600 underline' : ''}`}>
                                        {s.status}
                                    </span>
                                    <span className="text-[10px] font-bold opacity-50">{s.count} events</span>
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
        <div className={`p-8 space-y-4 transition-colors ${isAlert ? 'bg-red-600 text-white' : 'bg-background text-foreground'
            }`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{label}</span>
                {isAlert ? <AlertCircle size={20} /> : <Zap size={20} />}
            </div>
            <div className="space-y-1">
                <div className="text-5xl font-black italic tracking-tighter">{value}</div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{subtext}</p>
            </div>
        </div>
    );
}
