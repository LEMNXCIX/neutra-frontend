"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Banner = { id: string; title: string; subtitle?: string; cta?: string; ctaUrl?: string; startsAt?: string; endsAt?: string; active?: boolean };

export default function BannersAdminClient() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', cta: '', ctaUrl: '', startsAt: '', endsAt: '', active: true });
  const [editing, setEditing] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners', { credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      setBanners(Array.isArray(json.banners) ? json.banners : []);
    } catch { toast.error('Failed loading') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []);

  const create = async () => {
    try {
      const res = await fetch('/api/admin/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form), credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Created'); setForm({ title: '', subtitle: '', cta: '', ctaUrl: '', startsAt: '', endsAt: '', active: true }); load();
    } catch { toast.error('Request failed') }
  }

  const startEdit = (b: Banner) => { setEditing(b); setOpen(true) }

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/admin/banners/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing), credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Saved'); setOpen(false); setEditing(null); load();
    } catch { toast.error('Request failed') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Deleted'); load();
    } catch { toast.error('Request failed') }
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Banners</h2>
        <div className="text-sm text-muted-foreground">{loading ? 'Loading…' : `${banners.length} items`}</div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Add Banner</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          <Input placeholder="CTA text" value={form.cta} onChange={(e) => setForm(f => ({ ...f, cta: e.target.value }))} />
          <Input placeholder="CTA URL" value={form.ctaUrl} onChange={(e) => setForm(f => ({ ...f, ctaUrl: e.target.value }))} />
          <label className="text-sm">Starts At</label>
          <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm(f => ({ ...f, startsAt: e.target.value }))} />
          <label className="text-sm">Ends At</label>
          <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm(f => ({ ...f, endsAt: e.target.value }))} />
          <div className="flex gap-2 items-center">
            <label className="text-sm">Active</label>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} />
            <Button onClick={create}>Create</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map(b => (
              <TableRow key={b.id}>
                <TableCell>{b.title}</TableCell>
                <TableCell>{b.active ? 'Yes' : 'No'}</TableCell>
                <TableCell>{(b.startsAt || '') + ' → ' + (b.endsAt || '')}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(b)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {banners.map(b => (
          <Card key={b.id}>
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-base">{b.title}</CardTitle>
              <span className={`text-xs px-2 py-1 rounded ${b.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {b.active ? 'Active' : 'Inactive'}
              </span>
            </CardHeader>
            <CardContent className="text-sm flex flex-col gap-2">
              {b.subtitle && <div className="text-muted-foreground">{b.subtitle}</div>}
              <div className="text-xs text-muted-foreground">
                {(b.startsAt || 'No start') + ' → ' + (b.endsAt || 'No end')}
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => startEdit(b)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Banner</DialogTitle></DialogHeader>
          {editing && (
            <div className="flex flex-col gap-2">
              <Input value={editing.title} onChange={(e) => setEditing(b => b && { ...b, title: e.target.value })} />
              <Input value={editing.subtitle || ''} onChange={(e) => setEditing(b => b && { ...b, subtitle: e.target.value })} />
              <Input value={editing.cta || ''} onChange={(e) => setEditing(b => b && { ...b, cta: e.target.value })} />
              <Input value={editing.ctaUrl || ''} onChange={(e) => setEditing(b => b && { ...b, ctaUrl: e.target.value })} />
              <label className="text-sm">Starts At</label>
              <Input type="datetime-local" value={editing.startsAt || ''} onChange={(e) => setEditing(b => b && { ...b, startsAt: e.target.value })} />
              <label className="text-sm">Ends At</label>
              <Input type="datetime-local" value={editing.endsAt || ''} onChange={(e) => setEditing(b => b && { ...b, endsAt: e.target.value })} />
              <div className="flex gap-2 items-center"><label>Active</label><input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing(b => b && { ...b, active: e.target.checked })} /></div>
            </div>
          )}
          <DialogFooter className="mt-4"><Button onClick={saveEdit}>Save</Button><Button variant="ghost" onClick={() => { setOpen(false); setEditing(null) }}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
