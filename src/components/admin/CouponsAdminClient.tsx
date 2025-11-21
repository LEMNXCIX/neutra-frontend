"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Plus,
  Ticket,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight,
  Percent,
  DollarSign,
} from "lucide-react";

type Coupon = {
  code: string;
  type: "amount" | "percent";
  value: number;
  used?: boolean;
  expires?: string;
};

type Stats = {
  totalCoupons: number;
  usedCoupons: number;
  unusedCoupons: number;
  expiredCoupons: number;
  activeCoupons: number;
};

export default function CouponsAdminClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCoupons: 0,
    usedCoupons: 0,
    unusedCoupons: 0,
    expiredCoupons: 0,
    activeCoupons: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "amount" as "amount" | "percent",
    value: "",
    expires: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());

      const res = await fetch(`/api/admin/coupons?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Failed to load coupons");
        return;
      }
      const data = await res.json();
      setCoupons(data.coupons || []);
      setStats(data.stats || {
        totalCoupons: 0,
        usedCoupons: 0,
        unusedCoupons: 0,
        expiredCoupons: 0,
        activeCoupons: 0
      });
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [typeFilter, statusFilter, currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    load();
  };

  const handleTypeFilterChange = (newFilter: string) => {
    setTypeFilter(newFilter);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const createCoupon = async () => {
    if (!form.code) {
      toast.error("Code is required");
      return;
    }
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value || 0),
        expires: form.expires || null,
      };
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Failed to create coupon");
        return;
      }
      toast.success("Coupon created");
      setCreateOpen(false);
      setForm({ code: "", type: "amount", value: "", expires: "" });
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const deleteCoupon = async (code: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(code)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Coupon deleted");
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      expires: c.expires || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value || 0),
        expires: form.expires || null,
      };
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(editing.code)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Failed to update");
        return;
      }
      toast.success("Coupon updated");
      setEditOpen(false);
      setEditing(null);
      setForm({ code: "", type: "amount", value: "", expires: "" });
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const isExpired = (expiresStr?: string) => {
    if (!expiresStr) return false;
    try {
      return new Date(expiresStr) < new Date();
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getCouponStatus = (c: Coupon) => {
    if (c.used) return { label: "Used", variant: "secondary" as const, color: "text-muted-foreground" };
    if (isExpired(c.expires)) return { label: "Expired", variant: "destructive" as const, color: "text-red-500" };
    return { label: "Active", variant: "default" as const, color: "text-green-500" };
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

  const MobileStatsAccordion = () => (
    <Accordion type="single" collapsible className="w-full lg:hidden">
      <AccordionItem value="stats" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Coupon Statistics</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-2">
          <div className="grid grid-cols-1 gap-4">
            <StatCard icon={Ticket} title="Total Coupons" value={stats.totalCoupons} color="bg-purple-500" />
            <StatCard icon={Zap} title="Active" value={stats.activeCoupons} color="bg-green-500" />
            <StatCard icon={CheckCircle2} title="Used" value={stats.usedCoupons} color="bg-blue-500" />
            <StatCard icon={XCircle} title="Unused" value={stats.unusedCoupons} color="bg-gray-500" />
            <StatCard icon={Clock} title="Expired" value={stats.expiredCoupons} color="bg-red-500" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const Pagination = () => {
    const startItem = coupons.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="min-w-[2.5rem]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <div className="sm:hidden text-sm text-muted-foreground px-2">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Coupons Management</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {/* Statistics */}
      {/* Statistics – Desktop (ocultas en móvil) */}
      <div className="hidden md:grid md:grid-cols-5 gap-4">
        <StatCard icon={Ticket} title="Total Coupons" value={stats.totalCoupons} color="bg-purple-500" />
        <StatCard icon={Zap} title="Active" value={stats.activeCoupons} color="bg-green-500" />
        <StatCard icon={CheckCircle2} title="Used" value={stats.usedCoupons} color="bg-blue-500" />
        <StatCard icon={XCircle} title="Unused" value={stats.unusedCoupons} color="bg-gray-500" />
        <StatCard icon={Clock} title="Expired" value={stats.expiredCoupons} color="bg-red-500" />
      </div>

      {/* Statistics – Mobile (solo visible en móvil y tablet) */}
      <MobileStatsAccordion />
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="percent">Percent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Search by code..."
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

      {/* Coupons Table - Desktop */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {["Code", "Type", "Value", "Status", "Expires", "Actions"].map((th) => (
                    <TableHead key={th}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
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
                  <TableHead className="w-[150px]">Code</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[120px]">Value</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[150px]">Expires</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No coupons found
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((c) => {
                    const status = getCouponStatus(c);
                    return (
                      <TableRow key={c.code} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-bold">{c.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {c.type === "percent" ? (
                              <Percent className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="capitalize">{c.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {c.type === "percent" ? `${c.value}%` : `$${c.value}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(c.expires)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteCoupon(c.code)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
        {!loading && totalItems > 0 && <Pagination />}
      </Card>

      {/* Coupons Cards - Mobile/Tablet */}
      <div className="space-y-3 lg:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="pt-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
          : coupons.map((c) => {
            const status = getCouponStatus(c);
            return (
              <Card key={c.code} className="shadow-sm border-muted/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-mono font-bold text-lg">{c.code}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {c.type === "percent" ? (
                          <Percent className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm capitalize">{c.type}</span>
                        <span className="font-medium">
                          {c.type === "percent" ? `${c.value}%` : `$${c.value}`}
                        </span>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expires: {formatDate(c.expires)}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => openEdit(c)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteCoupon(c.code)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        {!loading && totalItems > 0 && (
          <Card className="lg:hidden">
            <Pagination />
          </Card>
        )}
      </div>

      {/* Create Coupon Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Code *</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="COUPON CODE"
                className="uppercase"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as "amount" | "percent" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Amount ($)</SelectItem>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Value *</label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percent" ? "10" : "25"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expires (Optional)</label>
              <Input
                type="date"
                value={form.expires}
                onChange={(e) => setForm({ ...form, expires: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createCoupon}>Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Code *</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="COUPON CODE"
                className="uppercase"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as "amount" | "percent" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Amount ($)</SelectItem>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Value *</label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percent" ? "10" : "25"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expires (Optional)</label>
              <Input
                type="date"
                value={form.expires}
                onChange={(e) => setForm({ ...form, expires: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}