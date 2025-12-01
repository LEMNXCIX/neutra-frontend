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
import {
    Edit,
    Trash2,
    Plus,
    Folder,
    Package,
    TrendingUp,
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

import { Category } from "@/types/category.types";

type CategoryWithCount = Category & {
    productCount?: number;
};

type Stats = {
    totalCategories: number;
    totalProducts: number;
    averageProductsPerCategory: number;
};

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
};

type Props = {
    categories: CategoryWithCount[];
    stats: Stats;
    pagination: PaginationProps;
};

export default function CategoriesTableClient({ categories, stats, pagination }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { confirm, ConfirmDialog } = useConfirm();

    // Dialog states
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<CategoryWithCount | null>(null);
    const [form, setForm] = useState({ name: "", description: "" });

    // URL State
    const searchQuery = searchParams.get("search") || "";

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

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const createCategory = async () => {
        if (!form.name) {
            toast.error("Name is required");
            return;
        }
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to create category");
                return;
            }
            toast.success("Category created");
            setCreateOpen(false);
            setForm({ name: "", description: "" });
            router.refresh();
        } catch {
            toast.error("Network error");
        }
    };

    const deleteCategory = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Category",
            description: "Are you sure you want to delete this category? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                toast.error("Failed to delete");
                return;
            }
            toast.success("Category deleted");
            router.refresh();
        } catch {
            toast.error("Network error");
        }
    };

    const openEdit = (c: CategoryWithCount) => {
        setEditing(c);
        setForm({
            name: c.name,
            description: c.description || "",
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        try {
            const res = await fetch(`/api/admin/categories/${editing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to update");
                return;
            }
            toast.success("Category updated");
            setEditOpen(false);
            setEditing(null);
            setForm({ name: "", description: "" });
            router.refresh();
        } catch {
            toast.error("Network error");
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
                <h2 className="text-xl font-medium">Categories Management</h2>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Statistics - Desktop */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
                <StatCard icon={Folder} title="Total Categories" value={stats.totalCategories} color="bg-purple-500" />
                <StatCard icon={Package} title="Total Products" value={stats.totalProducts} color="bg-blue-500" />
                <StatCard icon={TrendingUp} title="Avg Products/Category" value={stats.averageProductsPerCategory} color="bg-green-500" />
            </div>

            {/* Statistics - Mobile */}
            <Accordion type="single" collapsible className="w-full md:hidden">
                <AccordionItem value="stats" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Category Statistics</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-1 gap-4">
                            <StatCard icon={Folder} title="Total Categories" value={stats.totalCategories} color="bg-purple-500" />
                            <StatCard icon={Package} title="Total Products" value={stats.totalProducts} color="bg-blue-500" />
                            <StatCard icon={TrendingUp} title="Avg Products/Category" value={stats.averageProductsPerCategory} color="bg-green-500" />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by name, ID, or description..."
                            defaultValue={searchQuery}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch(e.currentTarget.value);
                                }
                            }}
                            className="max-w-md"
                        />
                        <Button onClick={() => {
                            const input = document.querySelector('input[placeholder="Search by name, ID, or description..."]') as HTMLInputElement;
                            handleSearch(input?.value || "");
                        }}>Search</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Categories Table - Desktop */}
            <Card className="hidden md:block">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">ID</TableHead>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead className="w-[300px]">Description</TableHead>
                                <TableHead className="w-[100px]">Products</TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No categories found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((c) => (
                                    <TableRow key={c.id} className="hover:bg-muted/30">
                                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {c.description || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {c.productCount || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => deleteCategory(c.id)}>
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

            {/* Categories Cards - Mobile */}
            <div className="space-y-3 md:hidden">
                {categories.map((c) => (
                    <Card key={c.id} className="shadow-sm border-muted/50">
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{c.name}</h3>
                                    <p className="text-xs text-muted-foreground font-mono mt-1">{c.id}</p>
                                </div>
                                <Badge variant="secondary">
                                    {c.productCount || 0} products
                                </Badge>
                            </div>
                            {c.description && (
                                <p className="text-sm text-muted-foreground">{c.description}</p>
                            )}
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => openEdit(c)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteCategory(c.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Mobile Pagination */}
                {pagination.totalItems > 0 && (
                    <Card className="md:hidden">
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

            {/* Create Category Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Category name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={createCategory}>Create Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Category Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Category name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Optional description"
                            />
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
