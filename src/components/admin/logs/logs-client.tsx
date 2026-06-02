"use client";

import React, { useCallback, useEffect, useReducer, useRef } from "react";
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
import { cn } from "@/lib/utils";

type LogsState = {
  logs: LogEntry[];
  total: number;
  loading: boolean;
  selectedLog: LogEntry | null;
  searchTerm: string;
  filters: {
    level: string;
    tenantId: string;
    startDate: string;
    endDate: string;
    skip: number;
    take: number;
  };
};

type LogsAction =
  | { type: "SET_LOGS"; payload: LogEntry[] }
  | { type: "SET_TOTAL"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SELECTED_LOG"; payload: LogEntry | null }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_FILTERS"; payload: LogsState["filters"] };

function logsReducer(state: LogsState, action: LogsAction): LogsState {
  switch (action.type) {
    case "SET_LOGS":
      return { ...state, logs: action.payload };
    case "SET_TOTAL":
      return { ...state, total: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SELECTED_LOG":
      return { ...state, selectedLog: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: action.payload };
    default:
      return state;
  }
}

interface LogsClientProps {
    initialLogs: LogEntry[];
    initialTotal: number;
    tenants: Tenant[];
}

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

function LogInspectorDialog({
  log,
  onClose,
}: {
  log: LogEntry | null;
  onClose: () => void;
}) {
  if (!log) return null;

  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Log Inspector</DialogTitle>
          <DialogDescription>Detailed view of the system log entry</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col min-h-full bg-background">
          <div className="p-8 space-y-6 bg-foreground text-background">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold tracking-tighter leading-none">{log.statusCode}</div>
                  <div className="px-3 py-1 bg-primary text-primary-foreground font-bold uppercase text-xs rounded-lg tracking-widest">{log.method}</div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 bg-white/5 px-2 py-1 rounded">TRACE_ID: {log.traceId}</div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm font-semibold opacity-60">{format(new Date(log.timestamp), "eeee, dd MMMM yyyy")}</div>
                <div className="text-2xl font-bold tracking-tight">{format(new Date(log.timestamp), "HH:mm:ss.SSS")}</div>
              </div>
            </div>
            <div className="text-lg font-mono font-medium break-all leading-relaxed bg-white/5 rounded-xl p-5 border border-white/10">{log.url}</div>
          </div>
          <div className="p-8 space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetaInfo label="Performance" value={`${log.duration}ms`} icon={<Clock />} large color={log.duration > 1000 ? "text-rose-500" : "text-emerald-500"} />
              <MetaInfo label="Client IP" value={log.ip || "UNKNOWN"} icon={<Globe />} />
              <MetaInfo label="User ID" value={log.userId || "GUEST"} icon={<User />} />
              <MetaInfo label="Tenant" value={log.tenantId || "GLOBAL"} icon={<Activity />} />
            </div>
            <div className="space-y-4">
              <SectionTitle title="Execution Summary" icon={<Terminal />} />
              <div className="p-6 bg-muted/30 rounded-2xl border-l border-primary/60 font-semibold tracking-tight text-xl leading-snug">{log.message}</div>
            </div>
            <div className="grid grid-cols-1 gap-10">
              <PayloadBoard title="Contextual Metadata" data={log.metadata} />
              {log.error && Object.keys(log.error).length > 0 && (
                <PayloadBoard title="Error Diagnostics" data={log.error} isCritical />
              )}
              <div className="space-y-4">
                <SectionTitle title="Client Agent" icon={<Globe />} />
                <div className="text-[10px] font-mono leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/50 text-muted-foreground">{log.userAgent}</div>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border p-6 flex justify-end">
            <Button onClick={onClose} className="rounded-xl font-bold h-11 px-10 shadow-lg">Close Inspector</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LogsFiltersSection({
  filters,
  searchTerm,
  tenants,
  updateFilters,
  dispatch,
}: {
  filters: LogsState["filters"];
  searchTerm: string;
  tenants: Tenant[];
  updateFilters: (patch: Partial<LogsState["filters"]>) => void;
  dispatch: React.Dispatch<LogsAction>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="log-level"
            className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground"
          >
            <Filter size={10} /> Level
          </label>
          <select
            id="log-level"
            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
            value={filters.level}
            onChange={(e) =>
              updateFilters({ level: e.target.value })
            }
          >
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="log-tenant"
            className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground"
          >
            <Building2 size={10} /> Tenant
          </label>
          <select
            id="log-tenant"
            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
            value={filters.tenantId}
            onChange={(e) =>
              updateFilters({ tenantId: e.target.value })
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

        <div className="space-y-2">
          <label
            htmlFor="log-start-date"
            className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground"
          >
            <Calendar size={10} /> Start
          </label>
          <input
            id="log-start-date"
            type="date"
            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm"
            value={filters.startDate}
            onChange={(e) =>
              updateFilters({
                startDate: e.target.value,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="log-end-date"
            className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground"
          >
            <Calendar size={10} /> End
          </label>
          <input
            id="log-end-date"
            type="date"
            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm"
            value={filters.endDate}
            onChange={(e) =>
              updateFilters({
                endDate: e.target.value,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="log-limit"
            className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground"
          >
            <ArrowRight size={10} /> Limit
          </label>
          <select
            id="log-limit"
            className="w-full h-10 bg-background border border-border rounded-lg px-3 py-1 font-medium text-xs focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
            value={filters.take}
            onChange={(e) =>
              updateFilters({ take: Number(e.target.value) })
            }
          >
            <option value="50">50 Records</option>
            <option value="100">100 Records</option>
            <option value="500">500 Records</option>
            <option value="1000">1000 Records</option>
          </select>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          aria-label="Search logs"
          placeholder="Search by Trace ID, URL or Message content..."
          value={searchTerm}
          onChange={(e) => dispatch({ type: "SET_SEARCH_TERM", payload: e.target.value })}
          className="w-full h-12 pl-11 pr-4 bg-muted/30 border border-transparent focus:border-primary/30 focus:bg-background rounded-xl font-medium text-sm transition-all outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_SEARCH_TERM", payload: "" })}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full bg-muted hover:bg-border transition-colors"
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
            dispatch({ type: "SET_FILTERS", payload: {
              level: "",
              tenantId: "",
              startDate: "",
              endDate: "",
              skip: 0,
              take: 50,
            }});
            dispatch({ type: "SET_SEARCH_TERM", payload: "" });
          }}
          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}

function LogsDataTable({
  filteredLogs,
  loading,
  dispatch,
}: {
  filteredLogs: LogEntry[];
  loading: boolean;
  dispatch: React.Dispatch<LogsAction>;
}) {
  return (
    <Card className="t-card border-none shadow-xl overflow-hidden">
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
                    <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Loading Records…
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
                    <Database className="size-12 mb-2" />
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
                  role="button"
                  tabIndex={0}
                  onClick={() => dispatch({ type: "SET_SELECTED_LOG", payload: log })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch({ type: "SET_SELECTED_LOG", payload: log }); } }}
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
                      className="size-8 rounded-full p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden divide-y divide-border/50">
        {filteredLogs.map((log) => (
          <button
            type="button"
            key={log.id}
            className="p-5 space-y-3 hover:bg-muted/30 active:bg-muted transition-colors group text-left w-full"
            onClick={() => dispatch({ type: "SET_SELECTED_LOG", payload: log })}
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
          </button>
        ))}
      </div>
    </Card>
  );
}

export function LogsClient({
    initialLogs,
    initialTotal,
    tenants,
}: LogsClientProps) {
  const [state, dispatch] = useReducer(logsReducer, null, () => ({
    logs: initialLogs,
    total: initialTotal,
    loading: false,
    selectedLog: null,
    searchTerm: "",
    filters: {
      level: "",
      tenantId: "",
      startDate: "",
      endDate: "",
      skip: 0,
      take: 50,
    },
  }));
  const filtersRef = useRef(state.filters);
  filtersRef.current = state.filters;

  const loadLogs = useCallback(async (overrideFilters?: typeof state.filters) => {
    const f = overrideFilters || filtersRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await logService.getAll(f);
      if (Array.isArray(response)) {
        dispatch({ type: "SET_LOGS", payload: response });
        dispatch({ type: "SET_TOTAL", payload: response.length });
      } else if (response && typeof response === "object") {
        const resAny = response as any;
        dispatch({ type: "SET_LOGS", payload: resAny.data || [] });
        dispatch({ type: "SET_TOTAL", payload: resAny.pagination?.total || resAny.data?.length || 0 });
      }
    } catch (error) {
      console.error("Error loading logs", error);
      dispatch({ type: "SET_LOGS", payload: [] });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const updateFilters = useCallback((patch: Partial<typeof state.filters>) => {
    dispatch({ type: "SET_FILTERS", payload: { ...state.filters, ...patch } });
    const next = { ...state.filters, ...patch };
    const hasFilters =
      next.level ||
      next.tenantId ||
      next.startDate ||
      next.endDate ||
      next.skip !== 0 ||
      next.take !== 50;
    if (hasFilters) {
      loadLogs(next);
    }
	}, [loadLogs, state.filters]);

	const filteredLogs = (state.logs || []).filter(
    (log) =>
      log.url.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      log.traceId?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(state.searchTerm.toLowerCase()),
  );

    return (
        <div className="space-y-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                        System Logs
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                        <Activity className="size-4 text-primary" /> Real-time
                        technical observability and system health
                    </p>
                </div>
                <div className="flex w-full md:w-auto gap-4">
                    <Button
                        onClick={() => loadLogs()}
          disabled={state.loading}
          className="h-11 px-6 rounded-xl font-bold shadow-md shadow-primary/10 transition-all hover:-translate-y-0.5"
        >
          <RefreshCcw
            className={`size-4 mr-2 ${state.loading ? "animate-spin" : ""}`}
                        />
                        Sync Logs
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickStat
                    label="Requests"
                    value={state.total}
                    icon={<Database />}
                    color="text-primary"
                    bg="bg-primary/5"
                />
                <QuickStat
                    label="Errors"
          value={
            (state.logs || []).filter((l) => l.statusCode >= 500).length
                    }
                    icon={<AlertCircle />}
                    color="text-rose-600"
                    bg="bg-rose-50"
                    isAlert
                />
                <QuickStat
                    label="Slow"
                    value={(state.logs || []).filter((l) => l.duration > 1000).length}
                    icon={<Clock />}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <QuickStat
                    label="Live Entries"
                    value={(state.logs || []).length}
                    icon={<Terminal />}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
            </div>

      <LogsFiltersSection
        filters={state.filters}
        searchTerm={state.searchTerm}
        tenants={tenants}
        updateFilters={updateFilters}
        dispatch={dispatch}
      />

      <LogsDataTable
        filteredLogs={filteredLogs}
        loading={state.loading}
        dispatch={dispatch}
      />

      <LogInspectorDialog log={state.selectedLog} onClose={() => dispatch({ type: "SET_SELECTED_LOG", payload: null })} />
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
                    type="button"
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
