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
import { Skeleton } from "@/components/ui/skeleton";
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

type Category = {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
};

type Stats = {
  totalCategories: number;
  totalProducts: number;
  averageProductsPerCategory: number;
};

export default function CategoriesAdminClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCategories: 0, totalProducts: 0, averageProductsPerCategory: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const { confirm, ConfirmDialog } = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());

      const res = await fetch(`/api/admin/categories?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Failed to load categories");
        return;
      }
      const data = await res.json();
      setCategories(data.categories || []);
      setStats(data.stats || { totalCategories: 0, totalProducts: 0, averageProductsPerCategory: 0 });
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
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    load();
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
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Failed to create category");
        return;
      }
      toast.success("Category created");
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      load();
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
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Category deleted");
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const openEdit = (c: Category) => {
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
        credentials: "same-origin",
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
      load();
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

  const Pagination = () => {
    const startItem = categories.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
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

  const MobileStatsAccordion = () => (
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
      <MobileStatsAccordion />

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table - Desktop */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {["ID", "Name", "Description", "Products", "Actions"].map((th) => (
                    <TableHead key={th}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
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
          )}
        </div>
        {!loading && totalItems > 0 && <Pagination />}
      </Card>

      {/* Categories Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="pt-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
          : categories.map((c) => (
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
        {!loading && totalItems > 0 && (
          <Card className="md:hidden">
            <Pagination />
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
