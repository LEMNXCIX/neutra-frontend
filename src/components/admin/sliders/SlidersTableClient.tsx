"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { slidersService } from "@/services/sliders.service";
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
import Image from "@/components/ui/image";
import {
    Edit,
    Trash2,
    Plus,
    ImageIcon,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Upload,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useConfirm } from "@/hooks/use-confirm";
import { Slideshow } from "@/types/slide.types";
import { Spinner } from "@/components/ui/spinner";

type Stats = {
    totalSliders: number;
    activeSliders: number;
    inactiveSliders: number;
    withImages: number;
};

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
};

type Props = {
    sliders: Slideshow[];
    stats: Stats;
    pagination: PaginationProps;
    isSuperAdmin?: boolean;
};

export default function SlidersTableClient({ sliders: initialSliders, stats, pagination, isSuperAdmin = false }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { confirm, ConfirmDialog } = useConfirm();

    const [sliders, setSliders] = useState<Slideshow[]>(initialSliders);
    const [loading, setLoading] = useState(false);

    const tenantFilter = searchParams.get('tenantId') || 'all';

    useEffect(() => {
        setSliders(initialSliders);
    }, [initialSliders]);

    const handleTenantFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === 'all') {
            params.delete('tenantId');
        } else {
            params.set('tenantId', value);
        }
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const loadSliders = async () => {
        try {
            setLoading(true);
            const data = await slidersService.getAll(tenantFilter === 'all' ? undefined : tenantFilter);
            setSliders(data);
        } catch (err) {
            console.error('Error loading sliders:', err);
            toast.error("Failed to load sliders");
        } finally {
            setLoading(false);
        }
    };

    // Dialog states
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<Slideshow | null>(null);
    const [form, setForm] = useState({
        title: "",
        desc: "",
        active: true,
        img: "",
    });
    const [imagePreview, setImagePreview] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (isEdit) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setEditing(s => s && ({ ...s, img: result } as any));
                setImagePreview(result);
            } else {
                setForm(f => ({ ...f, img: result }));
                setImagePreview(result);
            }
        };
        reader.readAsDataURL(file);
    };

    const createSlider = async () => {
        if (!form.title) {
            toast.error("Title is required");
            return;
        }
        setIsCreating(true);
        try {
            const res = await fetch("/api/slide", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to create slider");
                return;
            }
            toast.success("Slider created");
            setCreateOpen(false);
            setForm({ title: "", desc: "", active: true, img: "" });
            setImagePreview("");
            router.refresh();
        } catch {
            toast.error("Network error");
        } finally {
            setIsCreating(false);
        }
    };

    const deleteSlider = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Slider",
            description: "Are you sure you want to delete this slider? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!confirmed) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/slide/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                toast.error("Failed to delete");
                return;
            }
            toast.success("Slider deleted");
            router.refresh();
        } catch {
            toast.error("Network error");
        } finally {
            setIsDeleting(null);
        }
    };

    const openEdit = (s: Slideshow) => {
        setEditing(s);
        setForm({
            title: s.title,
            desc: s.desc || "",
            active: s.active ?? true,
            img: "",
        });
        setImagePreview(s.img || "");
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        setIsEditing(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const body: any = {
                ...editing,
                title: form.title,
                desc: form.desc,
                active: form.active,
            };
            if (form.img) {
                body.img = form.img;
            }
            // If editing.img was updated via handleImageUpload directly to editing state, use it?
            // handleImageUpload updates editing state directly for img.
            // But form.img is used for new uploads in create mode.
            // In edit mode, handleImageUpload updates `editing.img` (via `setEditing`).
            // So `body` already has updated `img` from `...editing`.

            const res = await fetch(`/api/slide/${editing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to update");
                return;
            }
            toast.success("Slider updated");
            setEditOpen(false);
            setEditing(null);
            setForm({ title: "", desc: "", active: true, img: "" });
            setImagePreview("");
            router.refresh();
        } catch {
            toast.error("Network error");
        } finally {
            setIsEditing(false);
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
                <h2 className="text-xl font-medium">Sliders Management</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {isSuperAdmin && (
                        <Select value={tenantFilter} onValueChange={handleTenantFilterChange}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="All Tenants" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tenants</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Slider
                    </Button>
                </div>
            </div>

            {/* Statistics - Desktop */}
            <div className="hidden md:grid md:grid-cols-4 gap-4">
                <StatCard icon={ImageIcon} title="Total Sliders" value={stats.totalSliders} color="bg-purple-500" />
                <StatCard icon={CheckCircle2} title="Active Sliders" value={stats.activeSliders} color="bg-green-500" />
                <StatCard icon={XCircle} title="Inactive Sliders" value={stats.inactiveSliders} color="bg-red-500" />
                <StatCard icon={Upload} title="With Images" value={stats.withImages} color="bg-blue-500" />
            </div>

            {/* Statistics - Mobile */}
            <Accordion type="single" collapsible className="w-full md:hidden">
                <AccordionItem value="stats" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Slider Statistics</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-1 gap-4">
                            <StatCard icon={ImageIcon} title="Total Sliders" value={stats.totalSliders} color="bg-purple-500" />
                            <StatCard icon={CheckCircle2} title="Active Sliders" value={stats.activeSliders} color="bg-green-500" />
                            <StatCard icon={XCircle} title="Inactive Sliders" value={stats.inactiveSliders} color="bg-red-500" />
                            <StatCard icon={Upload} title="With Images" value={stats.withImages} color="bg-blue-500" />
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
                                placeholder="Search by title, ID, or description..."
                                defaultValue={searchQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(e.currentTarget.value);
                                    }
                                }}
                                className="max-w-md"
                            />
                            <Button onClick={() => {
                                const input = document.querySelector('input[placeholder="Search by title, ID, or description..."]') as HTMLInputElement;
                                handleSearch(input?.value || "");
                            }}>Search</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sliders Table - Desktop */}
            <Card className="hidden lg:block">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">ID</TableHead>
                                <TableHead className="w-[120px]">Image</TableHead>
                                {isSuperAdmin && <TableHead className="w-[120px]">Tenant</TableHead>}
                                <TableHead className="w-[220px]">Title</TableHead>
                                <TableHead className="w-[100px]">Active</TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sliders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No sliders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sliders.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-muted/30">
                                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                                        <TableCell>
                                            {s.img ? (
                                                <Image
                                                    src={s.img}
                                                    alt={s.title}
                                                    width={100}
                                                    height={60}
                                                    className="object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-[100px] h-[60px] bg-muted rounded flex items-center justify-center">
                                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        {isSuperAdmin && (
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                                    {s.tenantId}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{s.title}</div>
                                                {s.desc && (
                                                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {s.active ? (
                                                <Badge className="bg-green-500">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEdit(s)} disabled={isDeleting === s.id}>
                                                    {isDeleting === s.id ? <Spinner className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => deleteSlider(s.id)} disabled={isDeleting === s.id}>
                                                    {isDeleting === s.id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
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

            {/* Sliders Cards - Mobile/Tablet */}
            <div className="space-y-3 lg:hidden">
                {sliders.map((s) => (
                    <Card key={s.id} className="shadow-sm border-muted/50">
                        <CardContent className="pt-4 space-y-3">
                            {s.img && (
                                <div className="relative w-full h-40 rounded overflow-hidden">
                                    <Image
                                        src={s.img}
                                        alt={s.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{s.title}</h3>
                                    {s.desc && (
                                        <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground font-mono mt-1">{s.id}</p>
                                </div>
                                {s.active ? (
                                    <Badge className="bg-green-500">Active</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => openEdit(s)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteSlider(s.id)}>
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

            {/* Create Slider Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Slider</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Slider title"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={form.desc}
                                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Image</label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, false)}
                            />
                            {imagePreview && (
                                <div className="mt-2 relative w-full h-32 rounded overflow-hidden">
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
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
                        <Button variant="outline" onClick={() => {
                            setCreateOpen(false);
                            setImagePreview("");
                        }}>Cancel</Button>
                        <Button onClick={createSlider} disabled={isCreating}>
                            {isCreating ? <><Spinner className="mr-2" /> Creating...</> : "Create Slider"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Slider Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Slider</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Slider title"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={form.desc}
                                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Image</label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, true)}
                            />
                            {imagePreview && (
                                <div className="mt-2 relative w-full h-32 rounded overflow-hidden">
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
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
                        <Button variant="outline" onClick={() => {
                            setEditOpen(false);
                            setImagePreview("");
                        }}>Cancel</Button>
                        <Button onClick={saveEdit} disabled={isEditing}>
                            {isEditing ? <><Spinner className="mr-2" /> Saving...</> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog />
        </div>
    );
}
