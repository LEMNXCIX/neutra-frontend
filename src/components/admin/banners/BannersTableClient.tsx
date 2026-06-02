"use client";

import React, { useRef, useState, useReducer, useCallback, useSyncExternalStore, Suspense } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { bannersService } from "@/services/banners.service";

const formatDateTime = (date?: Date | string) => {
    if (!date) return "—";
    try {
        return new Date(date).toLocaleString();
    } catch {
        return String(date);
    }
};

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
    isSuperAdmin?: boolean;
};

const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="size-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

type BannerForm = { title: string; subtitle: string; cta: string; ctaUrl: string; startsAt: string; endsAt: string; active: boolean };

const BannerFormFields = ({
  form,
  setForm,
  prefix,
}: {
  form: BannerForm;
  setForm: (form: BannerForm) => void;
  prefix: string;
}) => (
  <div className="space-y-4">
    <div>
      <label htmlFor={`${prefix}-title`} className="text-sm font-medium">Title *</label>
      <Input id={`${prefix}-title`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Banner title" />
    </div>
    <div>
      <label htmlFor={`${prefix}-subtitle`} className="text-sm font-medium">Subtitle</label>
      <Input id={`${prefix}-subtitle`} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Optional subtitle" />
    </div>
    <div>
      <label htmlFor={`${prefix}-cta`} className="text-sm font-medium">CTA Text</label>
      <Input id={`${prefix}-cta`} value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Call to action text" />
    </div>
    <div>
      <label htmlFor={`${prefix}-cta-url`} className="text-sm font-medium">CTA URL</label>
      <Input id={`${prefix}-cta-url`} value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="/path or https://..." />
    </div>
    <div>
      <label htmlFor={`${prefix}-starts-at`} className="text-sm font-medium">Starts At</label>
      <Input id={`${prefix}-starts-at`} type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
    </div>
    <div>
      <label htmlFor={`${prefix}-ends-at`} className="text-sm font-medium">Ends At</label>
      <Input id={`${prefix}-ends-at`} type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
    </div>
    <div className="flex items-center gap-2">
      <Switch id={`${prefix}-active`} checked={form.active} onCheckedChange={(checked: boolean) => setForm({ ...form, active: checked })} />
      <label htmlFor={`${prefix}-active`} className="text-sm font-medium">Active</label>
    </div>
  </div>
);

type BannersDialogState = {
  createOpen: boolean;
  editOpen: boolean;
  form: BannerForm;
  isCreating: boolean;
  isEditing: boolean;
  isDeleting: string | null;
};

type BannersDialogAction =
  | { type: "SET_CREATE_OPEN"; payload: boolean }
  | { type: "SET_EDIT_OPEN"; payload: boolean }
  | { type: "SET_FORM"; payload: BannerForm }
  | { type: "SET_IS_CREATING"; payload: boolean }
  | { type: "SET_IS_EDITING"; payload: boolean }
  | { type: "SET_IS_DELETING"; payload: string | null };

function bannersDialogReducer(state: BannersDialogState, action: BannersDialogAction): BannersDialogState {
  switch (action.type) {
    case "SET_CREATE_OPEN":
      return { ...state, createOpen: action.payload };
    case "SET_EDIT_OPEN":
      return { ...state, editOpen: action.payload };
    case "SET_FORM":
      return { ...state, form: action.payload };
    case "SET_IS_CREATING":
      return { ...state, isCreating: action.payload };
    case "SET_IS_EDITING":
      return { ...state, isEditing: action.payload };
    case "SET_IS_DELETING":
      return { ...state, isDeleting: action.payload };
    default:
      return state;
  }
}

function StatsSection({ stats }: { stats: Stats }) {
  return (
    <>
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <StatCard icon={Flag} title="Total Banners" value={stats.totalBanners} color="bg-blue-500" />
        <StatCard icon={CheckCircle2} title="Active Banners" value={stats.activeBanners} color="bg-green-500" />
        <StatCard icon={XCircle} title="Inactive Banners" value={stats.inactiveBanners} color="bg-red-500" />
      </div>

      <Accordion type="single" collapsible className="w-full md:hidden">
        <AccordionItem value="stats" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Flag className="size-5 text-muted-foreground" />
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
    </>
  );
}

function FilterBar({
  statusFilter,
  searchQuery,
  onFilterChange,
  onSearch,
}: {
  statusFilter: string;
  searchQuery: string;
  onFilterChange: (v: string) => void;
  onSearch: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={onFilterChange}>
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
                if (e.key === "Enter") {
                  onSearch(e.currentTarget.value);
                }
              }}
              className="max-w-md"
            />
            <Button
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder="Search by title, ID, or subtitle..."]',
                ) as HTMLInputElement;
                onSearch(input?.value || "");
              }}
            >
              Search
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DesktopBannersTable({
  banners,
  isSuperAdmin,
  isDeleting,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
}: {
  banners: Banner[];
  isSuperAdmin: boolean;
  isDeleting: string | null;
  pagination: PaginationProps;
  onEdit: (b: Banner) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card className="hidden lg:block">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead className="w-[200px]">Title</TableHead>
              {isSuperAdmin && <TableHead className="w-[120px]">Tenant</TableHead>}
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
                <TableRow key={b.id} className="group hover:bg-muted/50 transition-colors border-b border-border/50">
                  <TableCell className="font-mono text-[10px] text-muted-foreground tracking-tighter py-4">
                    #{b.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="font-semibold text-sm">{b.title}</div>
                      {b.subtitle && (
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                          {b.subtitle}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                        {b.tenantId}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    {b.active ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="size-1 rounded-full bg-emerald-500" />
                      <span>{formatDateTime(b.startsAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-1 rounded-full bg-rose-500" />
                      <span>{formatDateTime(b.endsAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.cta ? (
                      <Badge variant="outline" className="font-bold text-[10px] bg-muted/30">
                        {b.cta}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="size-8 rounded-full hover:bg-primary/5 hover:text-primary" onClick={() => onEdit(b)}>
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full hover:bg-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(b.id)}
                        disabled={isDeleting === b.id}
                      >
                        {isDeleting === b.id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
            {pagination.totalItems} results
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>
              <ChevronLeft className="size-4 mr-1" />
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
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function MobileBannersCards({
  banners,
  isDeleting,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
}: {
  banners: Banner[];
  isDeleting: string | null;
  pagination: PaginationProps;
  onEdit: (b: Banner) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="space-y-3 lg:hidden">
      {banners.map((b) => (
        <Card key={b.id} className="shadow-sm border-muted/50">
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold">{b.title}</h3>
                {b.subtitle && <p className="text-sm text-muted-foreground mt-1">{b.subtitle}</p>}
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
              <Button size="sm" className="flex-1" onClick={() => onEdit(b)}>
                <Edit className="size-4 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(b.id)} disabled={isDeleting === b.id}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {pagination.totalItems > 0 && (
        <Card className="lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function CreateBannerDialog({
  open,
  form,
  isCreating,
  onOpenChange,
  onFormChange,
  onCreate,
}: {
  open: boolean;
  form: BannerForm;
  isCreating: boolean;
  onOpenChange: (v: boolean) => void;
  onFormChange: (f: BannerForm) => void;
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Banner</DialogTitle>
        </DialogHeader>
        <BannerFormFields form={form} setForm={onFormChange} prefix="create-banner" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onCreate} disabled={isCreating}>
            {isCreating ? <><Spinner className="mr-2" /> Creating…</> : "Create Banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditBannerDialog({
  open,
  form,
  isEditing,
  onOpenChange,
  onFormChange,
  onSave,
}: {
  open: boolean;
  form: BannerForm;
  isEditing: boolean;
  onOpenChange: (v: boolean) => void;
  onFormChange: (f: BannerForm) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Banner</DialogTitle>
        </DialogHeader>
        <BannerFormFields form={form} setForm={onFormChange} prefix="edit-banner" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={isEditing}>
            {isEditing ? <><Spinner className="mr-2" /> Saving…</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const emptySubscribe = () => () => {};

function BannersTableClientInner({
  banners: initialBanners,
  stats,
  pagination,
  isSuperAdmin = false,
}: Props) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm, ConfirmDialog } = useConfirm();

  const [banners, setBanners] = useState<Banner[]>(() => initialBanners);
  const loadingRef = useRef(false);

  const tenantFilter = searchParams.get("tenantId") || "all";

    const handleTenantFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === "all") {
            params.delete("tenantId");
        } else {
            params.set("tenantId", value);
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

  const loadBanners = useCallback(async () => {
    try {
      loadingRef.current = true;
      const data = await bannersService.getAll(
        tenantFilter === "all" ? undefined : tenantFilter,
      );
      setBanners(data);
    } catch (err) {
      console.error("Error loading banners:", err);
      toast.error("Failed to load banners");
    } finally {
      loadingRef.current = false;
    }
  }, [tenantFilter]);

  const editingRef = useRef<Banner | null>(null);
  const [dialogState, dispatch] = useReducer(bannersDialogReducer, {
    createOpen: false,
    editOpen: false,
    form: {
      title: "",
      subtitle: "",
      cta: "",
      ctaUrl: "",
      startsAt: "",
      endsAt: "",
      active: true,
    },
    isCreating: false,
    isEditing: false,
    isDeleting: null,
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
        if (!dialogState.form.title) {
            toast.error("Title is required");
            return;
        }
  dispatch({ type: "SET_IS_CREATING", payload: true });
  try {
await bannersService.create(dialogState.form as any);
      toast.success("Banner created");
      dispatch({ type: "SET_CREATE_OPEN", payload: false });
      dispatch({ type: "SET_FORM", payload: {
        title: "",
        subtitle: "",
        cta: "",
        ctaUrl: "",
        startsAt: "",
        endsAt: "",
active: true,
} });
      router.refresh();
        } catch (err: any) {
            toast.error(err?.message || "Failed to create banner");
        } finally {
            dispatch({ type: "SET_IS_CREATING", payload: false });
        }
    };

    const deleteBanner = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Banner",
            description:
                "Are you sure you want to delete this banner? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!confirmed) return;
        dispatch({ type: "SET_IS_DELETING", payload: id });
        try {
            await bannersService.delete(id);
            toast.success("Banner deleted");
            router.refresh();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete");
        } finally {
            dispatch({ type: "SET_IS_DELETING", payload: null });
        }
    };

    const openEdit = (b: Banner) => {
        editingRef.current = b;
  dispatch({ type: "SET_FORM", payload: {
    title: b.title,
    subtitle: b.subtitle || "",
    cta: b.cta || "",
    ctaUrl: b.ctaUrl || "",
    startsAt: b.startsAt
      ? new Date(b.startsAt).toISOString().slice(0, 16)
      : "",
    endsAt: b.endsAt
      ? new Date(b.endsAt).toISOString().slice(0, 16)
      : "",
    active: b.active ?? true,
  } });
  dispatch({ type: "SET_EDIT_OPEN", payload: true });
    };

    const saveEdit = async () => {
        if (!editingRef.current) return;
  dispatch({ type: "SET_IS_EDITING", payload: true });
  try {
    await bannersService.update(editingRef.current.id, dialogState.form as any);
    toast.success("Banner updated");
    dispatch({ type: "SET_EDIT_OPEN", payload: false });
editingRef.current = null;
      dispatch({ type: "SET_FORM", payload: {
        title: "",
        subtitle: "",
        cta: "",
        ctaUrl: "",
        startsAt: "",
        endsAt: "",
active: true,
} });
      router.refresh();
        } catch (err: any) {
            toast.error(err?.message || "Failed to update");
        } finally {
            dispatch({ type: "SET_IS_EDITING", payload: false });
        }
};

  if (!isMounted) return null;

  return (
    <div className="w-full space-y-6" suppressHydrationWarning>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Banners Management</h2>
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
          <Button onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: true })}>
            <Plus className="size-4 mr-2" />
            Add Banner
          </Button>
        </div>
      </div>

      <StatsSection stats={stats} />

      <FilterBar statusFilter={statusFilter} searchQuery={searchQuery} onFilterChange={handleFilterChange} onSearch={handleSearch} />

      <DesktopBannersTable
        banners={banners}
        isSuperAdmin={isSuperAdmin}
        isDeleting={dialogState.isDeleting}
        pagination={pagination}
        onEdit={openEdit}
        onDelete={deleteBanner}
        onPageChange={handlePageChange}
      />

      <MobileBannersCards
        banners={banners}
        isDeleting={dialogState.isDeleting}
        pagination={pagination}
        onEdit={openEdit}
        onDelete={deleteBanner}
        onPageChange={handlePageChange}
      />

      <CreateBannerDialog
        open={dialogState.createOpen}
        form={dialogState.form}
        isCreating={dialogState.isCreating}
        onOpenChange={(v: boolean) => dispatch({ type: "SET_CREATE_OPEN", payload: v })}
        onFormChange={(f: BannerForm) => dispatch({ type: "SET_FORM", payload: f })}
        onCreate={createBanner}
      />

      <EditBannerDialog
        open={dialogState.editOpen}
        form={dialogState.form}
        isEditing={dialogState.isEditing}
        onOpenChange={(v: boolean) => dispatch({ type: "SET_EDIT_OPEN", payload: v })}
        onFormChange={(f: BannerForm) => dispatch({ type: "SET_FORM", payload: f })}
        onSave={saveEdit}
      />

      <ConfirmDialog />
      </div>
    );
  }

export default function BannersTableClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <BannersTableClientInner {...props} />
    </Suspense>
  );
}
