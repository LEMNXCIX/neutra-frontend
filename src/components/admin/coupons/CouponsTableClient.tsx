"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { couponsService } from "@/services";
import { ApiError } from "@/lib/api-client";
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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { useConfirm } from "@/hooks/use-confirm";
import { Coupon, CouponType, CreateCouponDTO, UpdateCouponDTO } from "@/types/coupon.types";

type Stats = {
    totalCoupons: number;
    usedCoupons: number;
    unusedCoupons: number;
    expiredCoupons: number;
    activeCoupons: number;
};

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
};

type Props = {
    coupons: Coupon[];
    stats: Stats;
    pagination: PaginationProps;
};

export default function CouponsTableClient({ coupons, stats, pagination }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { confirm, ConfirmDialog } = useConfirm();

    // Dialog states
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editing, setEditing] = useState<Coupon | null>(null);
    const [viewing, setViewing] = useState<Coupon | null>(null);
    const [form, setForm] = useState<{
        code: string;
        type: CouponType;
        value: string;
        description: string;
        minPurchaseAmount: string;
        maxDiscountAmount: string;
        usageLimit: string;
        active: boolean;
        expiresAt: string;
    }>({
        code: "",
        type: CouponType.FIXED,
        value: "",
        description: "",
        minPurchaseAmount: "",
        maxDiscountAmount: "",
        usageLimit: "",
        active: true,
        expiresAt: "",
    });

    // URL State
    const searchQuery = searchParams.get("search") || "";
    const typeFilter = searchParams.get("type") || "all";
    const statusFilter = searchParams.get("status") || "all";

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handleTypeFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams);
        if (newFilter && newFilter !== "all") {
            params.set("type", newFilter);
        } else {
            params.delete("type");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handleStatusFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams);
        if (newFilter && newFilter !== "all") {
            params.set("status", newFilter);
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const resetForm = () => {
        setForm({
            code: "",
            type: CouponType.FIXED,
            value: "",
            description: "",
            minPurchaseAmount: "",
            maxDiscountAmount: "",
            usageLimit: "",
            active: true,
            expiresAt: "",
        });
    };

    const createCoupon = async () => {
        if (!form.code) {
            toast.error("Code is required");
            return;
        }
        try {
            const body: CreateCouponDTO = {
                code: form.code.trim().toUpperCase(),
                type: form.type,
                value: Number(form.value || 0),
                description: form.description || undefined,
                minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : undefined,
                maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                active: form.active,
                expiresAt: form.expiresAt ? new Date(form.expiresAt) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            };
            await couponsService.create(body);
            toast.success("Coupon created");
            setCreateOpen(false);
            resetForm();
            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to create coupon";
            toast.error(message);
        }
    };

    const deleteCoupon = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Coupon",
            description: "Are you sure you want to delete this coupon? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!confirmed) return;
        try {
            await couponsService.delete(id);
            toast.success("Coupon deleted");
            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to delete coupon";
            toast.error(message);
        }
    };

    const openEdit = (c: Coupon) => {
        setEditing(c);
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        let formattedDate = "";
        if (c.expiresAt) {
            try {
                const date = new Date(c.expiresAt);
                const offset = date.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                formattedDate = localISOTime;
            } catch (e) {
                console.error("Error parsing date", e);
            }
        }

        setForm({
            code: c.code,
            type: c.type,
            value: String(c.value),
            description: c.description || "",
            minPurchaseAmount: c.minPurchaseAmount ? String(c.minPurchaseAmount) : "",
            maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
            usageLimit: c.usageLimit ? String(c.usageLimit) : "",
            active: c.active,
            expiresAt: formattedDate,
        });
        setEditOpen(true);
    };

    const openView = (c: Coupon) => {
        setViewing(c);
        setViewOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        try {
            const body: UpdateCouponDTO = {
                code: form.code.trim().toUpperCase(),
                type: form.type,
                value: Number(form.value || 0),
                description: form.description || undefined,
                minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : undefined,
                maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                active: form.active,
                expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
            };
            await couponsService.update(editing.id, body);
            toast.success("Coupon updated");
            setEditOpen(false);
            setEditing(null);
            resetForm();
            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to update coupon";
            toast.error(message);
        }
    };

    const isExpired = (date?: Date | string) => {
        if (!date) return false;
        try {
            return new Date(date) < new Date();
        } catch {
            return false;
        }
    };

    const formatDate = (date?: Date | string) => {
        if (!date) return "—";
        try {
            return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString();
        } catch {
            return String(date);
        }
    };

    const getCouponStatus = (c: Coupon) => {
        const isFullyUsed = c.usageLimit ? c.usageCount >= c.usageLimit : false;

        if (!c.active) return { label: "Inactive", variant: "secondary" as const, color: "text-gray-500" };
        if (isFullyUsed) return { label: "Used/Limit Reached", variant: "secondary" as const, color: "text-muted-foreground" };
        if (isExpired(c.expiresAt)) return { label: "Expired", variant: "destructive" as const, color: "text-red-500" };
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

    const renderFormFields = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        placeholder="COUPON CODE"
                        className="uppercase"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                        value={form.type}
                        onValueChange={(v) => setForm({ ...form, type: v as CouponType })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={CouponType.FIXED}>Amount ($)</SelectItem>
                            <SelectItem value={CouponType.PERCENT}>Percent (%)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Value *</Label>
                    <Input
                        type="number"
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        placeholder={form.type === CouponType.PERCENT ? "10" : "25"}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Expires (Optional)</Label>
                    <Input
                        type="datetime-local"
                        value={form.expiresAt}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Min Purchase Amount</Label>
                    <Input
                        type="number"
                        value={form.minPurchaseAmount}
                        onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                        placeholder="0"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Max Discount Amount</Label>
                    <Input
                        type="number"
                        value={form.maxDiscountAmount}
                        onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                        placeholder="0"
                        disabled={form.type !== CouponType.PERCENT}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Usage Limit</Label>
                    <Input
                        type="number"
                        value={form.usageLimit}
                        onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                        placeholder="Unlimited"
                    />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                    <Switch
                        checked={form.active}
                        onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                    />
                    <Label>Active</Label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">Coupons Management</h2>
                <Button onClick={() => {
                    resetForm();
                    setCreateOpen(true);
                }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Coupon
                </Button>
            </div>

            {/* Statistics */}
            <div className="hidden md:grid md:grid-cols-5 gap-4">
                <StatCard icon={Ticket} title="Total Coupons" value={stats.totalCoupons} color="bg-purple-500" />
                <StatCard icon={Zap} title="Active" value={stats.activeCoupons} color="bg-green-500" />
                <StatCard icon={CheckCircle2} title="Used" value={stats.usedCoupons} color="bg-blue-500" />
                <StatCard icon={XCircle} title="Unused" value={stats.unusedCoupons} color="bg-gray-500" />
                <StatCard icon={Clock} title="Expired" value={stats.expiredCoupons} color="bg-red-500" />
            </div>

            {/* Statistics – Mobile */}
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
                                <SelectItem value={CouponType.FIXED}>Amount</SelectItem>
                                <SelectItem value={CouponType.PERCENT}>Percent</SelectItem>
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
                                defaultValue={searchQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(e.currentTarget.value);
                                    }
                                }}
                                className="max-w-md"
                            />
                            <Button onClick={() => {
                                const input = document.querySelector('input[placeholder="Search by code..."]') as HTMLInputElement;
                                handleSearch(input?.value || "");
                            }}>Search</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Coupons Table - Desktop */}
            <Card className="hidden lg:block">
                <div className="overflow-x-auto">
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
                                        <TableRow key={c.id} className="hover:bg-muted/30">
                                            <TableCell className="font-mono font-bold">{c.code}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {c.type === CouponType.PERCENT ? (
                                                        <Percent className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span className="capitalize">{c.type === CouponType.PERCENT ? 'Percent' : 'Fixed'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {c.type === CouponType.PERCENT ? `${c.value}%` : `$${c.value}`}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(c.expiresAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => openView(c)} title="View Details">
                                                        <Ticket className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)} title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => deleteCoupon(c.id)} title="Delete">
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
                </div>

                {/* Pagination */}
                {pagination.totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
                        <div className="text-sm text-muted-foreground">
                            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <div className="hidden sm:flex items-center gap-1">
                                <span className="text-sm text-muted-foreground px-2">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Coupons Cards - Mobile/Tablet */}
            <div className="space-y-3 lg:hidden">
                {coupons.map((c) => {
                    const status = getCouponStatus(c);
                    return (
                        <Card key={c.id} className="shadow-sm border-muted/50">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-mono font-bold text-lg">{c.code}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {c.type === CouponType.PERCENT ? (
                                                <Percent className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="text-sm capitalize">{c.type === CouponType.PERCENT ? 'Percent' : 'Fixed'}</span>
                                            <span className="font-medium">
                                                {c.type === CouponType.PERCENT ? `${c.value}%` : `$${c.value}`}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Expires: {formatDate(c.expiresAt)}
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openView(c)}>
                                        <Ticket className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                    <Button size="sm" className="flex-1" onClick={() => openEdit(c)}>
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => deleteCoupon(c.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Mobile Pagination */}
                {pagination.totalItems > 0 && (
                    <Card className="lg:hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            {/* Create Coupon Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Coupon</DialogTitle>
                    </DialogHeader>
                    {renderFormFields()}
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
                    {renderFormFields()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={saveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Coupon Dialog */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Coupon Details</DialogTitle>
                    </DialogHeader>
                    {viewing && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Code</label>
                                    <p className="font-mono font-bold text-lg">{viewing.code}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={getCouponStatus(viewing).variant}>{getCouponStatus(viewing).label}</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                                    <p className="capitalize">{viewing.type === CouponType.PERCENT ? 'Percent' : 'Fixed Amount'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Value</label>
                                    <p className="font-medium">
                                        {viewing.type === CouponType.PERCENT ? `${viewing.value}%` : `$${viewing.value}`}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <p className="text-sm">{viewing.description || "—"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Min Purchase</label>
                                    <p>${viewing.minPurchaseAmount || 0}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Max Discount</label>
                                    <p>{viewing.maxDiscountAmount ? `$${viewing.maxDiscountAmount}` : "Unlimited"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Usage</label>
                                    <p>{viewing.usageCount} / {viewing.usageLimit || "∞"}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Expires</label>
                                    <p>{formatDate(viewing.expiresAt)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t">
                                <div>
                                    <span className="block">Created</span>
                                    {formatDate(viewing.createdAt)}
                                </div>
                                <div>
                                    <span className="block">Updated</span>
                                    {formatDate(viewing.updatedAt)}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setViewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog />
        </div>
    );
}
