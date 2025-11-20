"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Product = { id: string; title: string; price: number; stock?: number; category?: string; image?: string };

async function fetchProducts(search?: string, category?: string) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000";
  const url = new URL("/api/products", base);
  if (search) url.searchParams.set("search", search);
  if (category && category !== "all")
    url.searchParams.set("category", category);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.products;
}

export default function ProductsAdminClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", stock: "", category: "", imageBase64: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [editingImageBase64, setEditingImageBase64] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts("", "all");
      setProducts(data || []);
      // load categories (public)
      try {
        const cRes = await fetch('/api/categories');
        const cJson = await cRes.json().catch(() => ({}));
        setCategories(Array.isArray(cJson.categories) ? cJson.categories : []);
      } catch {}
    } catch {
      toast.error("Failed loading");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      const body = {
        title: form.title,
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        category: form.category || undefined,
      };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed");
        return;
      }
      toast.success("Created");
      setForm({ title: "", price: "", stock: "" });
      load();
    } catch {
      toast.error("Request failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete product?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed");
        return;
      }
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Request failed");
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const payload: Record<string, unknown> = { ...editing } as Record<string, unknown>;
      if (editingImageBase64) payload.imageBase64 = editingImageBase64;
      const res = await fetch(`/api/admin/products/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed");
        return;
      }
      toast.success("Saved");
      setOpen(false);
      setEditing(null);
      setEditingImageBase64(null);
      load();
    } catch {
      toast.error("Request failed");
    }
  };

  const openEdit = (p: Product) => {
    setEditing({ ...p });
    setOpen(true);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Products</h2>
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${products.length} items`}
        </div>
      </div>

      {/* === CREATE FORM === */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Add Product</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            className="min-w-[160px]"
          />
          <Input
            placeholder="Price"
            value={form.price}
            type="number"
            onChange={(e) =>
              setForm((f) => ({ ...f, price: e.target.value }))
            }
            className="w-24"
          />
          <Input
            placeholder="Stock"
            value={form.stock}
            type="number"
            onChange={(e) =>
              setForm((f) => ({ ...f, stock: e.target.value }))
            }
            className="w-24"
          />
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={(e)=>{
              const file = e.target.files && e.target.files[0];
              if(!file) return;
              const reader = new FileReader();
              reader.onload = ()=>{
                const data = reader.result as string;
                setForm(f=> ({...f, imageBase64: data}));
                setPreview(data);
              };
              reader.readAsDataURL(file);
            }} />
            {preview && <Image src={preview} alt="preview" width={48} height={48} className="object-cover rounded" />}
          </div>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="border rounded px-2 py-1"
          >
            <option value="">(none)</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button onClick={create}>Create</Button>
        </CardContent>
      </Card>

      {/* === DESKTOP TABLE === */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>${p.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.stock ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(p.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* === MOBILE CARDS === */}
      <div className="flex flex-col gap-3 md:hidden">
        {products.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-base">{p.title}</CardTitle>
              <Badge variant="outline">{p.stock ?? 0}</Badge>
            </CardHeader>
            <CardContent className="text-sm flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span>${p.price.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* === EDIT DIALOG === */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-3 mt-2">
              <Input
                value={editing.title}
                placeholder="Title"
                onChange={(e) =>
                  setEditing((p) => p && { ...p, title: e.target.value })
                }
              />
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" onChange={(e)=>{
                  const file = e.target.files && e.target.files[0];
                  if(!file) return;
                  const reader = new FileReader();
                  reader.onload = ()=>{
                    const data = reader.result as string;
                    setEditingImageBase64(data);
                  };
                  reader.readAsDataURL(file);
                }} />
                {editing.image && <Image src={editing.image} alt="current" width={48} height={48} className="object-cover rounded" />}
              </div>
              <label className="text-sm">Category</label>
              <select
                value={editing.category || ''}
                onChange={(e) => setEditing((p) => p && { ...p, category: e.target.value })}
                className="border rounded px-2 py-1"
              >
                <option value="">(none)</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Input
                value={String(editing.price)}
                placeholder="Price"
                type="number"
                onChange={(e) =>
                  setEditing(
                    (p) => p && { ...p, price: Number(e.target.value) }
                  )
                }
              />
              <Input
                value={String(editing.stock ?? 0)}
                placeholder="Stock"
                type="number"
                onChange={(e) =>
                  setEditing(
                    (p) => p && { ...p, stock: Number(e.target.value) }
                  )
                }
              />
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button onClick={saveEdit}>Save</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
