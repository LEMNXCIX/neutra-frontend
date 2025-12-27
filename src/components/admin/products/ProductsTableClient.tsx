"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
    Upload,
    X,
    Edit,
    Trash2,
    Plus,
    Package,
    DollarSign,
    AlertTriangle,
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
import { Product } from "@/types/product.types";

type Stats = {
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
};

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
};

type Props = {
    products: Product[];
    stats: Stats;
    pagination: PaginationProps;
    categories: Array<{ id: string; name: string }>;
    isSuperAdmin?: boolean;
};

export default function ProductsTableClient({ products, stats, pagination, categories, isSuperAdmin = false }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { confirm, ConfirmDialog } = useConfirm();

    // Local state for UI interactions (Dialogs, Forms)
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState({ name: "", price: "", stock: "", category: "", imageBase64: "" });
    const [preview, setPreview] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // URL State
    const searchQuery = searchParams.get("search") || "";
    const categoryFilter = searchParams.get("category") || "all";
    const tenantFilter = searchParams.get("tenantId") || "all";

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1 on search
        router.push(`?${params.toString()}`);
    };

    const handleFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams);
        if (newFilter && newFilter !== "all") {
            params.set("category", newFilter);
        } else {
            params.delete("category");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handleTenantFilterChange = (newTenant: string) => {
        const params = new URLSearchParams(searchParams);
        if (newTenant && newTenant !== "all") {
            params.set("tenantId", newTenant);
        } else {
            params.delete("tenantId");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setForm({ ...form, imageBase64: base64 });
            setPreview(base64);
        };
        reader.readAsDataURL(file);
    };

    const createProduct = async () => {
        if (!form.name) {
            toast.error("Name is required");
            return;
        }
        if (Number(form.price) < 0 || Number(form.stock) < 0) {
            toast.error("Price and Stock cannot be negative");
            return;
        }

        setIsCreating(true);
        try {
            const body = {
                name: form.name,
                description: "",
                price: Number(form.price || 0),
                stock: Number(form.stock || 0),
                categoryIds: form.category ? [form.category] : [],
                image: form.imageBase64 || undefined,
                ownerId: "admin",
            };
            const res = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to create product");
                return;
            }
            toast.success("Product created");
            setCreateOpen(false);
            setForm({ name: "", price: "", stock: "", category: "", imageBase64: "" });
            setPreview(null);
            router.refresh();
        } catch {
            toast.error("Network error");
        } finally {
            setIsCreating(false);
        }
    };

    const deleteProduct = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Product",
            description: "Are you sure you want to delete this product? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!confirmed) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                toast.error("Failed to delete");
                return;
            }
            toast.success("Product deleted");
            router.refresh();
        } catch {
            toast.error("Network error");
        } finally {
            setIsDeleting(null);
        }
    };

    const openEdit = (p: Product) => {
        setEditing(p);
        setForm({
            name: p.name,
            price: String(p.price),
            stock: String(p.stock || 0),
            category: p.categories?.[0]?.id || "", // Assuming first category for now
            imageBase64: "",
        });
        setPreview(p.image || null);
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        if (Number(form.price) < 0 || Number(form.stock) < 0) {
            toast.error("Price and Stock cannot be negative");
            return;
        }

        setIsEditing(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const body: any = {
                name: form.name,
                price: Number(form.price || 0),
                stock: Number(form.stock || 0),
                categoryIds: form.category ? [form.category] : [],
            };
            if (form.imageBase64) body.image = form.imageBase64;

            const res = await fetch(`/api/admin/products/${editing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to update");
                return;
            }
            toast.success("Product updated");
            setEditOpen(false);
            setEditing(null);
            setForm({ name: "", price: "", stock: "", category: "", imageBase64: "" });
            setPreview(null);
            router.refresh();
        } catch {
            toast.error("Network error");
        } finally {
            setIsEditing(false);
        }
    };

    const getStockBadge = (stock: number) => {
        if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
        if (stock < 10) return <Badge className="bg-yellow-500">Low Stock</Badge>;
        return <Badge className="bg-green-500">In Stock</Badge>;
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
                <h2 className="text-xl font-medium">Products Management</h2>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            {/* Statistics - Desktop */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
                <StatCard icon={Package} title="Total Products" value={stats.totalProducts} color="bg-blue-500" />
                <StatCard icon={DollarSign} title="Total Inventory Value" value={`$${stats.totalValue.toFixed(2)}`} color="bg-green-500" />
                <StatCard icon={AlertTriangle} title="Low Stock Items" value={stats.lowStockCount} color="bg-yellow-500" />
            </div>

            {/* Statistics - Mobile */}
            <Accordion type="single" collapsible className="w-full md:hidden">
                <AccordionItem value="stats" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Product Statistics</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-1 gap-4">
                            <StatCard icon={Package} title="Total Products" value={stats.totalProducts} color="bg-blue-500" />
                            <StatCard icon={DollarSign} title="Total Inventory Value" value={`$${stats.totalValue.toFixed(2)}`} color="bg-green-500" />
                            <StatCard icon={AlertTriangle} title="Low Stock Items" value={stats.lowStockCount} color="bg-yellow-500" />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <Select value={categoryFilter} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isSuperAdmin && (
                            <div className="w-[180px]">
                                <Select value={tenantFilter} onValueChange={handleTenantFilterChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Tenants" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Tenants</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex gap-2 flex-1">
                            <Input
                                placeholder="Search by product name or ID..."
                                defaultValue={searchQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(e.currentTarget.value);
                                    }
                                }}
                                className="max-w-md"
                            />
                            <Button onClick={() => {
                                const input = document.querySelector('input[placeholder="Search by product name or ID..."]') as HTMLInputElement;
                                handleSearch(input?.value || "");
                            }}>Search</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table - Desktop */}
            <Card className="hidden lg:block">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead className="w-[120px]">ID</TableHead>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead className="w-[120px]">Category</TableHead>
                                {isSuperAdmin && <TableHead className="w-[100px]">Tenant</TableHead>}
                                <TableHead className="w-[100px]">Price</TableHead>
                                <TableHead className="w-[80px]">Stock</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No products found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((p) => (
                                    <TableRow key={p.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            {p.image ? (
                                                <Image
                                                    src={p.image}
                                                    alt={p.name}
                                                    width={48}
                                                    height={48}
                                                    className="rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {p.categories?.map(c => c.name).join(", ") || "—"}
                                        </TableCell>
                                        {isSuperAdmin && (
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-[10px]">
                                                    {p.tenantId}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        <TableCell className="font-semibold">${p.price.toFixed(2)}</TableCell>
                                        <TableCell>{p.stock || 0}</TableCell>
                                        <TableCell>{getStockBadge(p.stock || 0)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)}>
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

            {/* Products Grid - Mobile/Tablet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                {products.map((p) => (
                    <Card key={p.id} className="shadow-sm border-muted/50 overflow-hidden">
                        <div className="aspect-square bg-muted relative">
                            {p.image ? (
                                <Image
                                    src={p.image}
                                    alt={p.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-16 w-16 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <CardContent className="pt-4 space-y-3">
                            <div>
                                <h3 className="font-semibold text-sm line-clamp-2">{p.name}</h3>
                                <p className="text-xs text-muted-foreground font-mono mt-1">{p.id}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-lg">${p.price.toFixed(2)}</span>
                                {getStockBadge(p.stock || 0)}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => openEdit(p)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)} disabled={isDeleting === p.id}>
                                    {isDeleting === p.id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Mobile Pagination */}
                {pagination.totalItems > 0 && (
                    <Card className="lg:hidden sm:col-span-2">
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

            {/* Create Product Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Product name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Price</label>
                                <Input
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Stock</label>
                                <Input
                                    type="number"
                                    value={form.stock}
                                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Image</label>
                            <div className="mt-2 flex items-center gap-3">
                                {preview && (
                                    <div className="relative">
                                        <Image src={preview} alt="Preview" width={64} height={64} className="rounded object-cover" />
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                            onClick={() => {
                                                setPreview(null);
                                                setForm({ ...form, imageBase64: "" });
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <label className="cursor-pointer">
                                    <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                        <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Upload Image</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e, false)}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>Cancel</Button>
                        <Button onClick={createProduct} disabled={isCreating}>
                            {isCreating ? <><Spinner className="mr-2" /> Creating...</> : "Create Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Product Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Product name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Price</label>
                                <Input
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Stock</label>
                                <Input
                                    type="number"
                                    value={form.stock}
                                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Image</label>
                            <div className="mt-2 flex items-center gap-3">
                                {preview && (
                                    <div className="relative">
                                        <Image src={preview} alt="Preview" width={64} height={64} className="rounded object-cover" />
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                            onClick={() => {
                                                setPreview(null);
                                                setForm({ ...form, imageBase64: "" });
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <label className="cursor-pointer">
                                    <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                        <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Change Image</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e, true)}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isEditing}>Cancel</Button>
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
