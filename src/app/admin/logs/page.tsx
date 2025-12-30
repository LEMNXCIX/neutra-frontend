"use client";

import React, { useEffect, useState } from "react";
import { logService, LogEntry } from "@/services/log.service";
import { tenantService } from "@/services/tenant.service";
import { Tenant } from "@/types/tenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Search,
    RefreshCcw,
    AlertCircle,
    Activity,
    ChevronDown,
    Terminal,
    Eye,
    Clock,
    Globe,
    User,
    Database,
    Code,
    ArrowRight,
    Building2,
    Calendar,
    X,
    Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        level: "",
        tenantId: "",
        startDate: "",
        endDate: "",
        skip: 0,
        take: 50
    });

    const loadLogs = async () => {
        setLoading(true);
        try {
            const response = await logService.getAll(filters);
            if (Array.isArray(response)) {
                setLogs(response);
                setTotal(response.length);
            } else if (response && typeof response === 'object') {
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

    const loadTenants = async () => {
        try {
            const data = await tenantService.getAll();
            setTenants(data || []);
        } catch (error) {
            console.error("Error loading tenants", error);
        }
    };

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [filters]);

    const filteredLogs = (logs || []).filter(log =>
        log.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.traceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'ERROR':
            case 'FATAL':
                return <Badge className="bg-black dark:bg-white text-white dark:text-black rounded-none font-black uppercase tracking-widest text-[10px] ring-1 ring-inset ring-foreground">{level}</Badge>;
            case 'WARN':
                return <Badge variant="outline" className="border-2 border-foreground rounded-none font-black uppercase tracking-widest text-[10px]">{level}</Badge>;
            case 'INFO':
                return <Badge variant="secondary" className="rounded-none font-black uppercase tracking-widest text-[10px] opacity-70">{level}</Badge>;
            default:
                return <Badge variant="outline" className="rounded-none font-black uppercase tracking-widest text-[10px]">{level}</Badge>;
        }
    };

    const getStatusColor = (code: number) => {
        if (code >= 500) return "text-foreground font-black underline decoration-2 decoration-red-500 underline-offset-4";
        if (code >= 400) return "text-foreground font-black italic underline decoration-1 decoration-amber-500 underline-offset-4";
        if (code >= 200) return "text-foreground font-medium";
        return "text-muted-foreground";
    };

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-[1600px] mx-auto min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Header section - Strict BW Style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-foreground pb-8">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-2">System Logs</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Real-time technical observability
                    </p>
                </div>
                <div className="flex w-full md:w-auto gap-4">
                    <Button
                        onClick={() => loadLogs()}
                        disabled={loading}
                        className="h-14 px-8 bg-foreground text-background font-black uppercase tracking-widest rounded-none border-2 border-foreground hover:bg-background hover:text-foreground transition-all duration-200"
                    >
                        <RefreshCcw className={`h-5 w-5 mr-3 ${loading ? 'animate-spin' : ''}`} />
                        Sync Data
                    </Button>
                </div>
            </div>

            {/* Quick Stats - Grid with thick borders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-4 border-foreground divide-y-4 sm:divide-y-0 sm:divide-x-4 divide-foreground bg-foreground">
                <QuickStat label="Requests" value={total} icon={<Database />} />
                <QuickStat label="Errors" value={(logs || []).filter(l => l.statusCode >= 500).length} icon={<AlertCircle />} isAlert />
                <QuickStat label="Slow" value={(logs || []).filter(l => l.duration > 1000).length} icon={<Clock />} />
                <QuickStat label="Live" value={(logs || []).length} icon={<Terminal />} />
            </div>

            {/* Filters Section - BW Grid Layout */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Level Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Filter size={10} /> Level
                        </label>
                        <select
                            className="w-full h-10 bg-background border-2 border-foreground px-3 py-1 font-bold uppercase text-[10px] focus:bg-foreground focus:text-background outline-none transition-colors appearance-none cursor-pointer"
                            value={filters.level}
                            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                        >
                            <option value="">All Levels</option>
                            <option value="INFO">INFO</option>
                            <option value="WARN">WARN</option>
                            <option value="ERROR">ERROR</option>
                        </select>
                    </div>

                    {/* Tenant Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={10} /> Tenant
                        </label>
                        <select
                            className="w-full h-10 bg-background border-2 border-foreground px-3 py-1 font-bold uppercase text-[10px] focus:bg-foreground focus:text-background outline-none transition-colors appearance-none cursor-pointer"
                            value={filters.tenantId}
                            onChange={(e) => setFilters({ ...filters, tenantId: e.target.value })}
                        >
                            <option value="">All Stores</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={10} /> Start
                        </label>
                        <input
                            type="date"
                            className="w-full h-10 bg-background border-2 border-foreground px-3 py-1 font-bold text-[10px] focus:bg-foreground focus:text-background outline-none transition-colors invert dark:invert-0"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={10} /> End
                        </label>
                        <input
                            type="date"
                            className="w-full h-10 bg-background border-2 border-foreground px-3 py-1 font-bold text-[10px] focus:bg-foreground focus:text-background outline-none transition-colors invert dark:invert-0"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>

                    {/* Limit Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ArrowRight size={10} /> Limit
                        </label>
                        <select
                            className="w-full h-10 bg-background border-2 border-foreground px-3 py-1 font-bold uppercase text-[10px] focus:bg-foreground focus:text-background outline-none transition-colors appearance-none cursor-pointer"
                            value={filters.take}
                            onChange={(e) => setFilters({ ...filters, take: Number(e.target.value) })}
                        >
                            <option value="50">50 Records</option>
                            <option value="100">100 Records</option>
                            <option value="500">500 Records</option>
                            <option value="1000">1000 Records</option>
                        </select>
                    </div>
                </div>

                {/* Search Bar - Full Width below dropdowns */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by Trace ID, URL or Message content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-background border-2 border-foreground font-bold text-sm focus:bg-foreground focus:text-background transition-all duration-200 outline-none placeholder:text-muted-foreground/50"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center bg-foreground text-background hover:opacity-80 "
                        >
                            <X size={14} />
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
                                take: 50
                            });
                            setSearchTerm("");
                        }}
                        className="text-[11px] font-black uppercase tracking-[0.2em] italic hover:bg-foreground hover:text-background rounded-none underline decoration-2 underline-offset-4"
                    >
                        Reset All Parameters
                    </Button>
                </div>
            </div>

            {/* Data Table - BW Grid */}
            <div className="border-t-4 border-foreground pt-8">
                {/* Desktop */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b-4 border-foreground hover:bg-transparent">
                                <TableHead className="font-black uppercase tracking-widest text-foreground text-[10px] py-6">Timestamp</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-foreground text-[10px]">Level</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-foreground text-[10px]">Request</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-foreground text-[10px]">Status</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-foreground text-[10px]">Time</TableHead>
                                <TableHead className="text-right font-black uppercase tracking-widest text-foreground text-[10px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex items-center justify-center gap-4 animate-pulse">
                                            <div className="w-4 h-4 bg-foreground rounded-full animate-bounce" />
                                            <span className="font-black uppercase tracking-[0.3em] text-xl italic">Loading Database</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                                            <Database className="h-16 w-16" />
                                            <p className="font-black uppercase tracking-widest text-xs">No entries found matching your criteria</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow
                                        key={log.id}
                                        className="border-b-2 border-foreground hover:bg-foreground/5 group transition-colors cursor-pointer"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <TableCell className="py-6 font-mono text-[10px] leading-tight">
                                            <div className="font-black text-foreground">
                                                {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                                            </div>
                                            <div className="text-muted-foreground">{format(new Date(log.timestamp), "dd/MM/yyyy")}</div>
                                        </TableCell>
                                        <TableCell>{getLevelBadge(log.level)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 max-w-[500px]">
                                                <div className="font-black text-[10px] uppercase bg-foreground text-background px-1.5 py-0.5 inline-block w-fit leading-none">
                                                    {log.method}
                                                </div>
                                                <div className="font-mono text-[10px] truncate dark:text-muted-foreground" title={log.url}>
                                                    {log.url}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`font-black italic text-lg ${getStatusColor(log.statusCode)}`}>
                                            {log.statusCode}
                                        </TableCell>
                                        <TableCell>
                                            <div className={`font-mono text-[10px] font-black border border-current px-2 py-1 inline-block ${log.duration > 1000 ? "bg-foreground text-background" : "text-muted-foreground"
                                                }`}>
                                                {log.duration}ms
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-none border-2 border-foreground group-hover:bg-foreground group-hover:text-background transition-colors font-black uppercase text-[10px]"
                                            >
                                                Details <ArrowRight className="h-3 w-3 ml-2" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden">
                    {filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="p-6 border-b-2 border-foreground space-y-4 hover:bg-foreground/5 active:bg-foreground transition-colors group"
                            onClick={() => setSelectedLog(log)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {getLevelBadge(log.level)}
                                        <span className={`text-xl font-black italic ${getStatusColor(log.statusCode)}`}>{log.statusCode}</span>
                                    </div>
                                    <div className="font-black text-[10px] uppercase bg-foreground text-background px-2 py-0.5 w-fit group-active:text-foreground">
                                        {log.method}
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono font-black text-right uppercase tracking-tighter">
                                    {format(new Date(log.timestamp), "HH:mm:ss")}<br />
                                    {log.duration}ms
                                </div>
                            </div>
                            <div className="font-mono text-[11px] break-all leading-tight text-foreground/80 font-bold group-active:text-background">
                                {log.url}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Advanced Detail View - STRICT BW CODE STYLE */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 border-4 border-foreground bg-background text-foreground rounded-none shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,0.2)]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Log Inspector</DialogTitle>
                        <DialogDescription>Detailed view of the system log entry</DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="flex flex-col min-h-full">
                            {/* Dialog Head */}
                            <div className="p-8 space-y-6 border-b-4 border-foreground bg-foreground text-background">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="text-4xl font-black italic tracking-tighter">{selectedLog.statusCode}</div>
                                            <div className="px-3 py-1 bg-background text-foreground font-black uppercase text-sm tracking-widest">{selectedLog.method}</div>
                                        </div>
                                        <div className="font-mono text-xs uppercase tracking-widest opacity-70">
                                            TRACE_ID: {selectedLog.traceId}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black tracking-tight">{format(new Date(selectedLog.timestamp), "dd.MM.yyyy")}</div>
                                        <div className="text-3xl font-black italic tracking-tighter leading-none">{format(new Date(selectedLog.timestamp), "HH:mm:ss.SSS")}</div>
                                    </div>
                                </div>
                                <h1 className="text-2xl font-mono font-bold break-all leading-relaxed uppercase bg-background text-foreground p-4">
                                    {selectedLog.url}
                                </h1>
                            </div>

                            {/* Dialog Body */}
                            <div className="p-8 space-y-12">
                                {/* Context Column - Vertical layout for better readability */}
                                <div className="flex flex-col gap-3 max-w-2xl">
                                    <MetaInfo label="Performance" value={`${selectedLog.duration}ms`} icon={<Clock />} large />
                                    <MetaInfo label="Network IP" value={selectedLog.ip || "UNKNOWN"} icon={<Globe />} />
                                    <MetaInfo label="Identity UID" value={selectedLog.userId || "GUEST"} icon={<User />} />
                                    <MetaInfo label="Environment" value={selectedLog.tenantId || "GLOBAL"} icon={<Activity />} />
                                </div>

                                {/* Event Content */}
                                <div className="space-y-4">
                                    <SectionTitle title="Execution Summary" icon={<Terminal />} />
                                    <div className="p-6 bg-muted/40 border-l-8 border-foreground font-bold tracking-tight text-xl leading-snug">
                                        {selectedLog.message}
                                    </div>
                                </div>

                                {/* Structured Payloads */}
                                <div className="grid grid-cols-1 gap-12 pt-4">
                                    <PayloadBoard title="Contextual Metadata" data={selectedLog.metadata} />

                                    {selectedLog.error && Object.keys(selectedLog.error).length > 0 && (
                                        <PayloadBoard title="Error Diagnostics" data={selectedLog.error} isCritical />
                                    )}

                                    <div className="space-y-4">
                                        <SectionTitle title="Client Payload" />
                                        <div className="text-[10px] font-mono leading-relaxed bg-muted/20 p-4 border border-border">
                                            {selectedLog.userAgent}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="sticky bottom-0 bg-background border-t-4 border-foreground p-6 text-right">
                                <Button
                                    onClick={() => setSelectedLog(null)}
                                    className="bg-foreground text-background font-black uppercase tracking-widest px-12 h-12 rounded-none hover:bg-background hover:text-foreground border-2 border-foreground transition-all"
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

function QuickStat({ label, value, icon, isAlert = false }: { label: string, value: any, icon: any, isAlert?: boolean }) {
    return (
        <div className={`p-6 sm:p-8 flex items-center justify-between transition-colors ${isAlert ? 'bg-background text-foreground' : 'bg-foreground text-background'
            }`}>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none">{label}</p>
                <h3 className="text-4xl md:text-5xl font-black tracking-tighter italic">{value}</h3>
            </div>
            <div className={`p-3 border-2 ${isAlert ? 'border-foreground text-foreground' : 'border-background text-background'}`}>
                {icon && React.cloneElement(icon, { size: 24, strokeWidth: 3 })}
            </div>
        </div>
    );
}

function SectionTitle({ title, icon }: { title: string, icon?: any }) {
    return (
        <h4 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-foreground mb-4">
            {icon}
            {title}
            <div className="flex-1 h-px bg-foreground opacity-20" />
        </h4>
    );
}

function MetaInfo({ label, value, icon, large = false }: { label: string, value: string, icon: any, large?: boolean }) {
    return (
        <div className="border-2 border-foreground p-4 bg-background group hover:bg-foreground hover:text-background transition-colors duration-200">
            <div className="flex items-center gap-2 mb-2 opacity-50 font-black uppercase text-[9px] tracking-widest">
                {icon} {label}
            </div>
            <div className={`font-black tracking-tight break-all ${large ? 'text-2xl' : 'text-sm'}`}>
                {value}
            </div>
        </div>
    );
}

function PayloadBoard({ title, data, isCritical = false }: { title: string, data: any, isCritical?: boolean }) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <SectionTitle title={title} />
                <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
                    className="text-[10px] font-black uppercase tracking-widest hover:underline underline-offset-4"
                >
                    Copy Object
                </button>
            </div>
            <div className={`border-2 p-0 rounded-none overflow-hidden ${isCritical ? 'border-red-600' : 'border-foreground'}`}>
                {isCritical && (
                    <div className="bg-red-600 text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                        CRITICAL EXCEPTION DETECTED
                    </div>
                )}
                <pre className={`p-6 text-[11px] font-mono overflow-x-auto max-h-[500px] scrollbar-thin ${isCritical ? 'bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-200' : 'bg-background text-foreground'
                    }`}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
}
