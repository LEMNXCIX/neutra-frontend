"use client";

import React, { useEffect, useState } from "react";
import { logService, LogEntry } from "@/services/log.service";
import { Tenant } from "@/types/tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Search,
    RefreshCcw,
    AlertCircle,
    Activity,
    Terminal,
    Clock,
    Globe,
    User,
    Database,
    ArrowRight,
    Building2,
    Calendar,
    X,
    Filter,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface LogsClientProps {
    initialLogs: LogEntry[];
    initialTotal: number;
    tenants: Tenant[];
}

export function LogsClient({
    initialLogs,
    initialTotal,
    tenants,
}: LogsClientProps) {
    const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
    const [total, setTotal] = useState(initialTotal);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        level: "",
        tenantId: "",
        startDate: "",
        endDate: "",
        skip: 0,
        take: 50,
    });

    const loadLogs = async () => {
        setLoading(true);
        try {
            const response = await logService.getAll(filters);
            if (Array.isArray(response)) {
                setLogs(response);
                setTotal(response.length);
            } else if (response && typeof response === "object") {
                const resAny = response as any;
                setLogs(resAny.data || []);
                setTotal(resAny.pagination?.total || resAny.data?.length || 0);
            }
        } catch (error) {
            console.error("Error loading logs", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when filters change (except initial load)
    useEffect(() => {
        if (
            filters.level ||
            filters.tenantId ||
            filters.startDate ||
            filters.endDate ||
            filters.skip !== 0 ||
            filters.take !== 50
        ) {
            loadLogs();
        }
    }, [filters]);

    const filteredLogs = (logs || []).filter(
        (log) =>
            log.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.traceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.message.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const getLevelBadge = (level: string) => {
        switch (level) {
            case "ERROR":
            case "FATAL":
                return (
                    <Badge
                        variant="destructive"
                        className="rounded-md font-bold uppercase tracking-wider text-[9px] px-2 py-0.5"
                    >
                        {level}
                    </Badge>
                );
            case "WARN":
                return (
                    <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-700 hover:bg-amber-100 rounded-md font-bold uppercase tracking-wider text-[9px] px-2 py-0.5"
                    >
                        {level}
                    </Badge>
                );
            case "INFO":
                return (
                    <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-md font-bold uppercase tracking-wider text-[9px] px-2 py-0.5"
                    >
                        {level}
                    </Badge>
                );
            default:
                return (
                    <Badge
                        variant="outline"
                        className="rounded-md font-bold uppercase tracking-wider text-[9px] px-2 py-0.5"
                    >
                        {level}
                    </Badge>
                );
        }
    };

    const getStatusColor = (code: number) => {
        if (code >= 500) return "text-rose-600 font-bold";
        if (code >= 400) return "text-amber-600 font-bold";
        if (code >= 200) return "text-emerald-600 font-bold";
        return "text-muted-foreground font-medium";
    };

    return (
        <div className="space-y-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                        System Logs
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" /> Real-time
                        technical observability and system health
                    </p>
                </div>
                <div className="flex w-full md:w-auto gap-4">
                    <Button
                        onClick={() => loadLogs()}
                        disabled={loading}
                        className="h-11 px-6 rounded-xl font-bold shadow-md shadow-primary/10 transition-all hover:-translate-y-0.5"
                    >
                        <RefreshCcw
                            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                        />
                        Sync Logs
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickStat
                    label="Requests"
                    value={total}
                    icon={<Database />}
                    color="text-primary"
                    bg="bg-primary/5"
                />
                <QuickStat
                    label="Errors"
                    value={
                        (logs || []).filter((l) => l.statusCode >= 500).length
                    }
                    icon={<AlertCircle />}
                    color="text-rose-600"
                    bg="bg-rose-50"
                    isAlert
                />
                <QuickStat
                    label="Slow"
                    value={(logs || []).filter((l) => l.duration > 1000).length}
                    icon={<Clock />}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <QuickStat
                    label="Live Entries"
                    value={(logs || []).length}
                    icon={<Terminal />}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
            </div>

            {/* Filters Section */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Level Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                            <Filter size={10} /> Level
                        </label>
                        <select
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
                            value={filters.level}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    level: e.target.value,
                                })
                            }
                        >
                            <option value="">All Levels</option>
                            <option value="INFO">INFO</option>
                            <option value="WARN">WARN</option>
                            <option value="ERROR">ERROR</option>
                        </select>
                    </div>

                    {/* Tenant Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                            <Building2 size={10} /> Tenant
                        </label>
                        <select
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
                            value={filters.tenantId}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    tenantId: e.target.value,
                                })
                            }
                        >
                            <option value="">All Stores</option>
                            {tenants.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                            <Calendar size={10} /> Start
                        </label>
                        <input
                            type="date"
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm"
                            value={filters.startDate}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    startDate: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                            <Calendar size={10} /> End
                        </label>
                        <input
                            type="date"
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm"
                            value={filters.endDate}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    endDate: e.target.value,
                                })
                            }
                        />
                    </div>

                    {/* Limit Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                            <ArrowRight size={10} /> Limit
                        </label>
                        <select
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
                            value={filters.take}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    take: Number(e.target.value),
                                })
                            }
                        >
                            <option value="50">50 Records</option>
                            <option value="100">100 Records</option>
                            <option value="500">500 Records</option>
                            <option value="1000">1000 Records</option>
                        </select>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by Trace ID, URL or Message content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-muted/30 border border-transparent focus:border-primary/30 focus:bg-background rounded-xl font-medium text-sm transition-all outline-none"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-border transition-colors"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setFilters({
                                level: "",
                                tenantId: "",
                                startDate: "",
                                endDate: "",
                                skip: 0,
                                take: 50,
                            });
                            setSearchTerm("");
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            {/* Data Table */}
            <Card className="t-card border-none shadow-xl overflow-hidden">
                {/* Desktop */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-b border-border/50 hover:bg-transparent">
                                <TableHead className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] py-4">
                                    Timestamp
                                </TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                                    Level
                                </TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                                    Request
                                </TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                                    Status
                                </TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                                    Latency
                                </TableHead>
                                <TableHead className="text-right font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-64 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm font-semibold text-muted-foreground">
                                                Loading Records...
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-64 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                            <Database className="h-12 w-12 mb-2" />
                                            <p className="font-semibold text-sm">
                                                No entries match your search
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow
                                        key={log.id}
                                        className="border-b border-border/50 hover:bg-muted/30 group transition-colors cursor-pointer"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <TableCell className="py-4 font-mono text-[10px]">
                                            <div className="font-bold text-foreground">
                                                {format(
                                                    new Date(log.timestamp),
                                                    "HH:mm:ss.SSS",
                                                )}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {format(
                                                    new Date(log.timestamp),
                                                    "dd MMM yyyy",
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getLevelBadge(log.level)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 max-w-[400px] lg:max-w-[500px]">
                                                <div className="font-bold text-[9px] uppercase bg-muted px-1.5 py-0.5 rounded border border-border/50 w-fit">
                                                    {log.method}
                                                </div>
                                                <div
                                                    className="font-mono text-[10px] truncate text-muted-foreground"
                                                    title={log.url}
                                                >
                                                    {log.url}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            className={`font-bold text-base ${getStatusColor(log.statusCode)}`}
                                        >
                                            {log.statusCode}
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                className={`font-mono text-[10px] font-semibold px-2 py-1 rounded-md ${
                                                    log.duration > 1000
                                                        ? "bg-rose-50 text-rose-600"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {log.duration}ms
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-border/50">
                    {filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="p-5 space-y-3 hover:bg-muted/30 active:bg-muted transition-colors group"
                            onClick={() => setSelectedLog(log)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        {getLevelBadge(log.level)}
                                        <span
                                            className={`text-lg font-bold tracking-tight ${getStatusColor(log.statusCode)}`}
                                        >
                                            {log.statusCode}
                                        </span>
                                    </div>
                                    <div className="font-bold text-[9px] uppercase bg-muted border border-border/50 px-2 py-0.5 rounded w-fit">
                                        {log.method}
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono font-medium text-right text-muted-foreground uppercase">
                                    {format(
                                        new Date(log.timestamp),
                                        "HH:mm:ss",
                                    )}
                                    <br />
                                    <span
                                        className={
                                            log.duration > 1000
                                                ? "text-rose-500 font-bold"
                                                : ""
                                        }
                                    >
                                        {log.duration}ms
                                    </span>
                                </div>
                            </div>
                            <div className="font-mono text-[10px] break-all leading-tight text-muted-foreground font-medium">
                                {log.url}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Advanced Detail View */}
            <Dialog
                open={!!selectedLog}
                onOpenChange={() => setSelectedLog(null)}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Log Inspector</DialogTitle>
                        <DialogDescription>
                            Detailed view of the system log entry
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="flex flex-col min-h-full bg-background">
                            {/* Dialog Head */}
                            <div className="p-8 space-y-6 bg-foreground text-background">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div className="text-5xl font-bold tracking-tighter leading-none">
                                                {selectedLog.statusCode}
                                            </div>
                                            <div className="px-3 py-1 bg-primary text-primary-foreground font-bold uppercase text-xs rounded-lg tracking-widest">
                                                {selectedLog.method}
                                            </div>
                                        </div>
                                        <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 bg-white/5 px-2 py-1 rounded">
                                            TRACE_ID: {selectedLog.traceId}
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="text-sm font-semibold opacity-60">
                                            {format(
                                                new Date(selectedLog.timestamp),
                                                "eeee, dd MMMM yyyy",
                                            )}
                                        </div>
                                        <div className="text-2xl font-bold tracking-tight">
                                            {format(
                                                new Date(selectedLog.timestamp),
                                                "HH:mm:ss.SSS",
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-lg font-mono font-medium break-all leading-relaxed bg-white/5 rounded-xl p-5 border border-white/10">
                                    {selectedLog.url}
                                </div>
                            </div>

                            {/* Dialog Body */}
                            <div className="p-8 space-y-10">
                                {/* Context Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <MetaInfo
                                        label="Performance"
                                        value={`${selectedLog.duration}ms`}
                                        icon={<Clock />}
                                        large
                                        color={
                                            selectedLog.duration > 1000
                                                ? "text-rose-500"
                                                : "text-emerald-500"
                                        }
                                    />
                                    <MetaInfo
                                        label="Client IP"
                                        value={selectedLog.ip || "UNKNOWN"}
                                        icon={<Globe />}
                                    />
                                    <MetaInfo
                                        label="User ID"
                                        value={selectedLog.userId || "GUEST"}
                                        icon={<User />}
                                    />
                                    <MetaInfo
                                        label="Tenant"
                                        value={selectedLog.tenantId || "GLOBAL"}
                                        icon={<Activity />}
                                    />
                                </div>

                                {/* Event Content */}
                                <div className="space-y-4">
                                    <SectionTitle
                                        title="Execution Summary"
                                        icon={<Terminal />}
                                    />
                                    <div className="p-6 bg-muted/30 rounded-2xl border-l-4 border-primary font-semibold tracking-tight text-xl leading-snug">
                                        {selectedLog.message}
                                    </div>
                                </div>

                                {/* Structured Payloads */}
                                <div className="grid grid-cols-1 gap-10">
                                    <PayloadBoard
                                        title="Contextual Metadata"
                                        data={selectedLog.metadata}
                                    />

                                    {selectedLog.error &&
                                        Object.keys(selectedLog.error).length >
                                            0 && (
                                            <PayloadBoard
                                                title="Error Diagnostics"
                                                data={selectedLog.error}
                                                isCritical
                                            />
                                        )}

                                    <div className="space-y-4">
                                        <SectionTitle
                                            title="Client Agent"
                                            icon={<Globe />}
                                        />
                                        <div className="text-[10px] font-mono leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/50 text-muted-foreground">
                                            {selectedLog.userAgent}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border p-6 flex justify-end">
                                <Button
                                    onClick={() => setSelectedLog(null)}
                                    className="rounded-xl font-bold h-11 px-10 shadow-lg"
                                >
                                    Close Inspector
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Sub-components for strict design

function QuickStat({
    label,
    value,
    icon,
    color = "text-foreground",
    bg = "bg-muted",
    isAlert = false,
}: {
    label: string;
    value: any;
    icon: any;
    color?: string;
    bg?: string;
    isAlert?: boolean;
}) {
    return (
        <Card className="t-card border-none shadow-lg overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
                        {label}
                    </p>
                    <h3 className="text-3xl font-bold tracking-tighter">
                        {value}
                    </h3>
                </div>
                <div
                    className={`p-3 rounded-2xl ${bg} ${color} transition-transform group-hover:scale-110 duration-500`}
                >
                    {icon &&
                        React.cloneElement(icon, {
                            size: 20,
                            strokeWidth: 2.5,
                        })}
                </div>
            </CardContent>
        </Card>
    );
}

function SectionTitle({ title, icon }: { title: string; icon?: any }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            {icon && (
                <span className="text-primary">
                    {React.cloneElement(icon, { size: 14 })}
                </span>
            )}
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {title}
            </h4>
            <div className="flex-1 h-px bg-border/50" />
        </div>
    );
}

function MetaInfo({
    label,
    value,
    icon,
    large = false,
    color = "text-foreground",
}: {
    label: string;
    value: string;
    icon: any;
    large?: boolean;
    color?: string;
}) {
    return (
        <div className="bg-muted/30 rounded-xl p-4 border border-border/50 group hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground font-bold uppercase text-[9px] tracking-widest">
                {icon && React.cloneElement(icon, { size: 10 })} {label}
            </div>
            <div
                className={cn(
                    "font-bold tracking-tight break-all truncate",
                    large ? "text-xl" : "text-xs",
                    color,
                )}
            >
                {value}
            </div>
        </div>
    );
}

function PayloadBoard({
    title,
    data,
    isCritical = false,
}: {
    title: string;
    data: any;
    isCritical?: boolean;
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <SectionTitle title={title} />
                <button
                    onClick={() =>
                        navigator.clipboard.writeText(
                            JSON.stringify(data, null, 2),
                        )
                    }
                    className="text-[9px] font-bold uppercase tracking-wider text-primary hover:underline underline-offset-4"
                >
                    Copy JSON
                </button>
            </div>
            <div
                className={cn(
                    "rounded-2xl overflow-hidden border transition-all",
                    isCritical
                        ? "border-rose-500/30 shadow-lg shadow-rose-500/5"
                        : "border-border/50 shadow-sm",
                )}
            >
                {isCritical && (
                    <div className="bg-rose-500 text-white px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={10} /> CRITICAL EXCEPTION DETECTED
                    </div>
                )}
                <pre
                    className={cn(
                        "p-6 text-[10px] font-mono overflow-x-auto max-h-[400px] scrollbar-thin",
                        isCritical
                            ? "bg-rose-50/30 text-rose-900 dark:bg-rose-950/10 dark:text-rose-200"
                            : "bg-muted/20 text-muted-foreground",
                    )}
                >
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
}
