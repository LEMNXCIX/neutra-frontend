"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Category = { id: string; name: string; description?: string };

export default function CategoriesAdminClient() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', { credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      setCats(Array.isArray(json.categories) ? json.categories : []);
    } catch (e) {
      toast.error('Failed loading');
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []);

  const create = async () => {
    try {
      const res = await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form), credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Created');
      setForm({ name: '', description: '' });
      load();
    } catch { toast.error('Request failed') }
  }

  const startEdit = (c: Category) => { setEditing(c); setOpen(true) }

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/admin/categories/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing), credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Saved'); setOpen(false); setEditing(null); load();
    } catch { toast.error('Request failed') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete category?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Deleted'); load();
    } catch { toast.error('Request failed') }
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Categories</h2>
        <div className="text-sm text-muted-foreground">{loading ? 'Loading…' : `${cats.length} items`}</div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Add Category</CardTitle></CardHeader>
        <CardContent className="flex gap-2 items-center">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          <Button onClick={create}>Create</Button>
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cats.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.description || ''}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {cats.map(c => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{c.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm flex flex-col gap-2">
              <div className="text-muted-foreground">{c.description || 'No description'}</div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          {editing && (
            <div className="flex flex-col gap-2">
              <Input value={editing.name} onChange={(e) => setEditing(c => c && { ...c, name: e.target.value })} />
              <Input value={editing.description || ''} onChange={(e) => setEditing(c => c && { ...c, description: e.target.value })} />
            </div>
          )}
          <DialogFooter className="mt-4"><Button onClick={saveEdit}>Save</Button><Button variant="ghost" onClick={() => { setOpen(false); setEditing(null) }}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
