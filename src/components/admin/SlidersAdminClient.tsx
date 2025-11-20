"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "@/components/ui/image";

type Slide = { id: string; title: string; subtitle?: string; image?: string; startsAt?: string; endsAt?: string; active?: boolean };

export default function SlidersAdminClient() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', startsAt: '', endsAt: '', active: true, imageBase64: '' });
  const [editing, setEditing] = useState<Slide | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sliders', { credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      setSlides(Array.isArray(json.sliders) ? json.sliders : []);
    } catch { toast.error('Failed loading') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []);

  const create = async () => {
    try {
      const res = await fetch('/api/admin/sliders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form), credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Created'); setForm({ title: '', subtitle: '', startsAt: '', endsAt: '', active: true, imageBase64: '' }); load();
    } catch { toast.error('Request failed') }
  }

  const startEdit = (s: Slide) => { setEditing(s); setOpen(true) }

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const body: any = { ...editing };
      // if editing has imageBase64 property (managed in dialog) it will be included
      const res = await fetch(`/api/admin/sliders/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Saved'); setOpen(false); setEditing(null); load();
    } catch { toast.error('Request failed') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete slide?')) return;
    try {
      const res = await fetch(`/api/admin/sliders/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error || 'Failed'); return }
      toast.success('Deleted'); load();
    } catch { toast.error('Request failed') }
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Sliders</h2>
        <div className="text-sm text-muted-foreground">{loading ? 'Loading…' : `${slides.length} items`}</div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Add Slide</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          <label className="text-sm">Image</label>
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files && e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setForm(f => ({ ...f, imageBase64: reader.result as string })); reader.readAsDataURL(file);
          }} />
          <label className="text-sm">Starts At</label>
          <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm(f => ({ ...f, startsAt: e.target.value }))} />
          <label className="text-sm">Ends At</label>
          <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm(f => ({ ...f, endsAt: e.target.value }))} />
          <div className="flex gap-2 items-center"><label>Active</label><input type="checkbox" checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} /><Button onClick={create}>Create</Button></div>
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slides.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.title}</TableCell>
                <TableCell>{s.active ? 'Yes' : 'No'}</TableCell>
                <TableCell>{s.image ? <Image src={s.image} alt={s.title} width={120} height={60} className="object-cover" /> : ''}</TableCell>
                <TableCell className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => startEdit(s)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(s.id)}>Delete</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {slides.map(s => (
          <Card key={s.id}>
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-base">{s.title}</CardTitle>
              <span className={`text-xs px-2 py-1 rounded ${s.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {s.active ? 'Active' : 'Inactive'}
              </span>
            </CardHeader>
            <CardContent className="text-sm flex flex-col gap-2">
              {s.image && (
                <div className="w-full h-32 relative rounded overflow-hidden">
                  <Image src={s.image} alt={s.title} fill className="object-cover" />
                </div>
              )}
              {s.subtitle && <div className="text-muted-foreground">{s.subtitle}</div>}
              <div className="text-xs text-muted-foreground">
                {(s.startsAt || 'No start') + ' → ' + (s.endsAt || 'No end')}
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => startEdit(s)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Slide</DialogTitle></DialogHeader>
          {editing && (
            <div className="flex flex-col gap-2">
              <Input value={editing.title} onChange={(e) => setEditing(s => s && { ...s, title: e.target.value })} />
              <Input value={editing.subtitle || ''} onChange={(e) => setEditing(s => s && { ...s, subtitle: e.target.value })} />
              <label className="text-sm">Image</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files && e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setEditing(s => s && ({ ...s, imageBase64: reader.result as string } as any)); reader.readAsDataURL(file);
              }} />
              {editing.image && <Image src={editing.image} alt="current" width={240} height={120} className="object-cover" />}
              <label className="text-sm">Starts At</label>
              <Input type="datetime-local" value={editing.startsAt || ''} onChange={(e) => setEditing(s => s && { ...s, startsAt: e.target.value })} />
              <label className="text-sm">Ends At</label>
              <Input type="datetime-local" value={editing.endsAt || ''} onChange={(e) => setEditing(s => s && { ...s, endsAt: e.target.value })} />
              <div className="flex gap-2 items-center"><label>Active</label><input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing(s => s && { ...s, active: e.target.checked })} /></div>
            </div>
          )}
          <DialogFooter className="mt-4"><Button onClick={saveEdit}>Save</Button><Button variant="ghost" onClick={() => { setOpen(false); setEditing(null) }}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
