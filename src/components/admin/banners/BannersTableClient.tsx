"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
    Flag,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useConfirm } from "@/hooks/use-confirm";

import { Banner } from "@/types/banner.types";

type Stats = {
    totalBanners: number;
    activeBanners: number;
    inactiveBanners: number;
};

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
};

type Props = {
    banners: Banner[];
    stats: Stats;
    pagination: PaginationProps;
};

export default function BannersTableClient({ banners, stats, pagination }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { confirm, ConfirmDialog } = useConfirm();

    // Dialog states
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<Banner | null>(null);
    const [form, setForm] = useState({
        title: "",
        subtitle: "",
        cta: "",
        ctaUrl: "",
        startsAt: "",
        endsAt: "",
        active: true
    });

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
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handleFilterChange = (newFilter: string) => {
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

    const createBanner = async () => {
        if (!form.title) {
            toast.error("Title is required");
            return;
        }
        try {
            const res = await fetch("/api/admin/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to create banner");
                return;
            }
            toast.success("Banner created");
            setCreateOpen(false);
            setForm({ title: "", subtitle: "", cta: "", ctaUrl: "", startsAt: "", endsAt: "", active: true });
            router.refresh();
        } catch {
            toast.error("Network error");
        }
    };

    const deleteBanner = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Banner",
            description: "Are you sure you want to delete this banner? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/admin/banners/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                toast.error("Failed to delete");
                return;
            }
            toast.success("Banner deleted");
            router.refresh();
        } catch {
            toast.error("Network error");
        }
    };

    const openEdit = (b: Banner) => {
        setEditing(b);
        setForm({
            title: b.title,
            subtitle: b.subtitle || "",
            cta: b.cta || "",
            ctaUrl: b.ctaUrl || "",
            startsAt: b.startsAt ? new Date(b.startsAt).toISOString().slice(0, 16) : "",
            endsAt: b.endsAt ? new Date(b.endsAt).toISOString().slice(0, 16) : "",
            active: b.active ?? true,
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        try {
            const res = await fetch(`/api/admin/banners/${editing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to update");
                return;
            }
            toast.success("Banner updated");
            setEditOpen(false);
            setEditing(null);
            setForm({ title: "", subtitle: "", cta: "", ctaUrl: "", startsAt: "", endsAt: "", active: true });
            router.refresh();
        } catch {
            toast.error("Network error");
        }
    };

    const formatDateTime = (date?: Date | string) => {
        if (!date) return "—";
        try {
            return new Date(date).toLocaleString();
        } catch {
            return String(date);
        }
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
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">Banners Management</h2>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Banner
                </Button>
            </div>

            {/* Statistics - Desktop */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
                <StatCard icon={Flag} title="Total Banners" value={stats.totalBanners} color="bg-blue-500" />
                <StatCard icon={CheckCircle2} title="Active Banners" value={stats.activeBanners} color="bg-green-500" />
                <StatCard icon={XCircle} title="Inactive Banners" value={stats.inactiveBanners} color="bg-red-500" />
            </div>

            {/* Statistics - Mobile */}
            <Accordion type="single" collapsible className="w-full md:hidden">
                <AccordionItem value="stats" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <Flag className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Banner Statistics</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-1 gap-4">
                            <StatCard icon={Flag} title="Total Banners" value={stats.totalBanners} color="bg-blue-500" />
                            <StatCard icon={CheckCircle2} title="Active Banners" value={stats.activeBanners} color="bg-green-500" />
                            <StatCard icon={XCircle} title="Inactive Banners" value={stats.inactiveBanners} color="bg-red-500" />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

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
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2 flex-1">
                            <Input
                                placeholder="Search by title, ID, or subtitle..."
                                defaultValue={searchQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(e.currentTarget.value);
                                    }
                                }}
                                className="max-w-md"
                            />
                            <Button onClick={() => {
                                const input = document.querySelector('input[placeholder="Search by title, ID, or subtitle..."]') as HTMLInputElement;
                                handleSearch(input?.value || "");
                            }}>Search</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Banners Table - Desktop */}
            <Card className="hidden lg:block">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">ID</TableHead>
                                <TableHead className="w-[200px]">Title</TableHead>
                                <TableHead className="w-[100px]">Active</TableHead>
                                <TableHead className="w-[250px]">Period</TableHead>
                                <TableHead className="w-[150px]">CTA</TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {banners.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No banners found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                banners.map((b) => (
                                    <TableRow key={b.id} className="hover:bg-muted/30">
                                        <TableCell className="font-mono text-xs">{b.id}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{b.title}</div>
                                                {b.subtitle && (
                                                    <div className="text-xs text-muted-foreground">{b.subtitle}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {b.active ? (
                                                <Badge className="bg-green-500">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            <div>{formatDateTime(b.startsAt)}</div>
                                            <div>→ {formatDateTime(b.endsAt)}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {b.cta || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => deleteBanner(b.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
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

            {/* Banners Cards - Mobile/Tablet */}
            <div className="space-y-3 lg:hidden">
                {banners.map((b) => (
                    <Card key={b.id} className="shadow-sm border-muted/50">
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{b.title}</h3>
                                    {b.subtitle && (
                                        <p className="text-sm text-muted-foreground mt-1">{b.subtitle}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground font-mono mt-1">{b.id}</p>
                                </div>
                                {b.active ? (
                                    <Badge className="bg-green-500">Active</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>Starts: {formatDateTime(b.startsAt)}</div>
                                <div>Ends: {formatDateTime(b.endsAt)}</div>
                                {b.cta && <div className="font-medium">CTA: {b.cta}</div>}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => openEdit(b)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteBanner(b.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

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

            {/* Create Banner Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Banner</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Banner title"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Subtitle</label>
                            <Input
                                value={form.subtitle}
                                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                                placeholder="Optional subtitle"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">CTA Text</label>
                            <Input
                                value={form.cta}
                                onChange={(e) => setForm({ ...form, cta: e.target.value })}
                                placeholder="Call to action text"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">CTA URL</label>
                            <Input
                                value={form.ctaUrl}
                                onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                                placeholder="/path or https://..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Starts At</label>
                            <Input
                                type="datetime-local"
                                value={form.startsAt}
                                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Ends At</label>
                            <Input
                                type="datetime-local"
                                value={form.endsAt}
                                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={form.active}
                                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                            />
                            <label className="text-sm font-medium">Active</label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={createBanner}>Create Banner</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Banner Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Banner</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Banner title"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Subtitle</label>
                            <Input
                                value={form.subtitle}
                                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                                placeholder="Optional subtitle"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">CTA Text</label>
                            <Input
                                value={form.cta}
                                onChange={(e) => setForm({ ...form, cta: e.target.value })}
                                placeholder="Call to action text"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">CTA URL</label>
                            <Input
                                value={form.ctaUrl}
                                onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                                placeholder="/path or https://..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Starts At</label>
                            <Input
                                type="datetime-local"
                                value={form.startsAt}
                                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Ends At</label>
                            <Input
                                type="datetime-local"
                                value={form.endsAt}
                                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={form.active}
                                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                            />
                            <label className="text-sm font-medium">Active</label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={saveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog />
        </div>
    );
}
