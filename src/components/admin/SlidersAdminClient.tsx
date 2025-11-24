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
type Slide = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  startsAt?: string;
  endsAt?: string;
  active?: boolean;
};

type Stats = {
  totalSliders: number;
  activeSliders: number;
  inactiveSliders: number;
  withImages: number;
};

export default function SlidersAdminClient() {
  const [sliders, setSliders] = useState<Slide[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSliders: 0, activeSliders: 0, inactiveSliders: 0, withImages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    startsAt: "",
    endsAt: "",
    active: true,
    imageBase64: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const { confirm, ConfirmDialog } = useConfirm();
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());

      const res = await fetch(`/api/admin/sliders?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Failed to load sliders");
        return;
      }
      const data = await res.json();
      setSliders(data.sliders || []);
      setStats(data.stats || { totalSliders: 0, activeSliders: 0, inactiveSliders: 0, withImages: 0 });
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
  }, [statusFilter, currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    load();
  };

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isEdit) {
        setEditing(s => s && ({ ...s, imageBase64: result } as any));
        setImagePreview(result);
      } else {
        setForm(f => ({ ...f, imageBase64: result }));
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
    try {
      const res = await fetch("/api/admin/sliders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Failed to create slider");
        return;
      }
      toast.success("Slider created");
      setCreateOpen(false);
      setForm({ title: "", subtitle: "", startsAt: "", endsAt: "", active: true, imageBase64: "" });
      setImagePreview("");
      load();
    } catch {
      toast.error("Network error");
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
    try {
      const res = await fetch(`/api/admin/sliders/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Slider deleted");
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const openEdit = (s: Slide) => {
    setEditing(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle || "",
      startsAt: s.startsAt || "",
      endsAt: s.endsAt || "",
      active: s.active ?? true,
      imageBase64: "",
    });
    setImagePreview(s.image || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const body: any = {
        ...editing,
        title: form.title,
        subtitle: form.subtitle,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        active: form.active,
      };
      if (form.imageBase64) {
        body.imageBase64 = form.imageBase64;
      }
      const res = await fetch(`/api/admin/sliders/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Failed to update");
        return;
      }
      toast.success("Slider updated");
      setEditOpen(false);
      setEditing(null);
      setForm({ title: "", subtitle: "", startsAt: "", endsAt: "", active: true, imageBase64: "" });
      setImagePreview("");
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
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
    const startItem = sliders.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
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
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Sliders Management</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Slider
        </Button>
      </div>

      {/* Statistics - Desktop */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <StatCard icon={ImageIcon} title="Total Sliders" value={stats.totalSliders} color="bg-purple-500" />
        <StatCard icon={CheckCircle2} title="Active Sliders" value={stats.activeSliders} color="bg-green-500" />
        <StatCard icon={XCircle} title="Inactive Sliders" value={stats.inactiveSliders} color="bg-red-500" />
        <StatCard icon={Upload} title="With Images" value={stats.withImages} color="bg-blue-500" />
      </div>

      {/* Statistics - Mobile */}
      <MobileStatsAccordion />

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-md"
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sliders Table - Desktop */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {["ID", "Image", "Title", "Active", "Period", "Actions"].map((th) => (
                    <TableHead key={th}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
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
                  <TableHead className="w-[120px]">Image</TableHead>
                  <TableHead className="w-[220px]">Title</TableHead>
                  <TableHead className="w-[100px]">Active</TableHead>
                  <TableHead className="w-[250px]">Period</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sliders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No sliders found
                    </TableCell>
                  </TableRow>
                ) : (
                  sliders.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{s.id}</TableCell>
                      <TableCell>
                        {s.image ? (
                          <Image
                            src={s.image}
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
                      <TableCell>
                        <div>
                          <div className="font-medium">{s.title}</div>
                          {s.subtitle && (
                            <div className="text-xs text-muted-foreground">{s.subtitle}</div>
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
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{formatDateTime(s.startsAt)}</div>
                        <div>→ {formatDateTime(s.endsAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteSlider(s.id)}>
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

      {/* Sliders Cards - Mobile/Tablet */}
      <div className="space-y-3 lg:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="pt-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))
          : sliders.map((s) => (
            <Card key={s.id} className="shadow-sm border-muted/50">
              <CardContent className="pt-4 space-y-3">
                {s.image && (
                  <div className="relative w-full h-40 rounded overflow-hidden">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{s.title}</h3>
                    {s.subtitle && (
                      <p className="text-sm text-muted-foreground mt-1">{s.subtitle}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono mt-1">{s.id}</p>
                  </div>
                  {s.active ? (
                    <Badge className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Starts: {formatDateTime(s.startsAt)}</div>
                  <div>Ends: {formatDateTime(s.endsAt)}</div>
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
        {!loading && totalItems > 0 && (
          <Card className="lg:hidden">
            <Pagination />
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
              <label className="text-sm font-medium">Subtitle</label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Optional subtitle"
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
            <Button variant="outline" onClick={() => {
              setCreateOpen(false);
              setImagePreview("");
            }}>Cancel</Button>
            <Button onClick={createSlider}>Create Slider</Button>
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
              <label className="text-sm font-medium">Subtitle</label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Optional subtitle"
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
            <Button variant="outline" onClick={() => {
              setEditOpen(false);
              setImagePreview("");
            }}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}
