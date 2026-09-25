"use client";
import { TablePagination, MobileTablePagination } from "@/components/admin/shared/TablePagination";

import { AdminStatCard as StatCard } from "@/components/admin/shared/AdminStatCard";
import { FilterSelect } from "@/components/admin/shared/FilterSelect";


import React, { useRef, useState, useCallback, useSyncExternalStore, useReducer, Suspense } from "react";
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


function SliderFormFields({
  form,
  setForm,
  imagePreview,
  prefix,
  onImageUpload,
}: {
  form: { title: string; desc: string; active: boolean; img: string };
  setForm: React.Dispatch<React.SetStateAction<{ title: string; desc: string; active: boolean; img: string }>>;
  imagePreview: string;
  prefix: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
}) {
  const isEdit = prefix === "edit";
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${prefix}-slider-title`} className="text-sm font-medium">Título *</label>
        <Input id={`${prefix}-slider-title`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del slider" />
      </div>
      <div>
        <label htmlFor={`${prefix}-slider-desc`} className="text-sm font-medium">Descripción</label>
        <Input id={`${prefix}-slider-desc`} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Descripción opcional" />
      </div>
      <div>
        <label htmlFor={`${prefix}-slider-image`} className="text-sm font-medium">Imagen</label>
        <Input id={`${prefix}-slider-image`} type="file" accept="image/*" onChange={(e) => onImageUpload(e, isEdit)} />
        {imagePreview && (
          <div className="mt-2 relative w-full h-32 rounded overflow-hidden">
            <Image src={imagePreview} alt="Vista Previa" fill sizes="96px" className="object-cover" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch id={`${prefix}-slider-active`} checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
        <label htmlFor={`${prefix}-slider-active`} className="text-sm font-medium">Activo</label>
      </div>
    </div>
  );
}

type SlidersDialogState = {
  createOpen: boolean;
  editOpen: boolean;
  form: { title: string; desc: string; active: boolean; img: string };
  imagePreview: string;
  isCreating: boolean;
  isEditing: boolean;
  isDeleting: string | null;
};

type SlidersDialogAction =
  | { type: "SET_CREATE_OPEN"; payload: boolean }
  | { type: "SET_EDIT_OPEN"; payload: boolean }
  | { type: "SET_FORM"; payload: SlidersDialogState["form"] }
  | { type: "SET_IMAGE_PREVIEW"; payload: string }
  | { type: "SET_IS_CREATING"; payload: boolean }
  | { type: "SET_IS_EDITING"; payload: boolean }
  | { type: "SET_IS_DELETING"; payload: string | null };

function slidersDialogReducer(state: SlidersDialogState, action: SlidersDialogAction): SlidersDialogState {
  switch (action.type) {
    case "SET_CREATE_OPEN":
      return { ...state, createOpen: action.payload };
    case "SET_EDIT_OPEN":
      return { ...state, editOpen: action.payload };
    case "SET_FORM":
      return { ...state, form: action.payload };
    case "SET_IMAGE_PREVIEW":
      return { ...state, imagePreview: action.payload };
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

const emptySubscribe = () => () => {};

function StatsSection({ stats }: { stats: Stats }) {
  return (
    <>
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <StatCard icon={ImageIcon} title="Total de carruseles" value={stats.totalSliders} color="bg-purple-500" />
        <StatCard icon={CheckCircle2} title="Carruseles activos" value={stats.activeSliders} color="bg-green-500" />
        <StatCard icon={XCircle} title="Carruseles inactivos" value={stats.inactiveSliders} color="bg-red-500" />
        <StatCard icon={Upload} title="Con Imágenes" value={stats.withImages} color="bg-blue-500" />
      </div>
      <Accordion type="single" collapsible className="w-full md:hidden">
        <AccordionItem value="stats" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <ImageIcon className="size-5 text-muted-foreground" />
              <span className="font-medium">Estadísticas de carruseles</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-1 gap-4">
              <StatCard icon={ImageIcon} title="Total de carruseles" value={stats.totalSliders} color="bg-purple-500" />
              <StatCard icon={CheckCircle2} title="Carruseles activos" value={stats.activeSliders} color="bg-green-500" />
              <StatCard icon={XCircle} title="Carruseles inactivos" value={stats.inactiveSliders} color="bg-red-500" />
              <StatCard icon={Upload} title="Con Imágenes" value={stats.withImages} color="bg-blue-500" />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}

function FilterBar({ statusFilter, searchQuery, onFilterChange, onSearch }: {
  statusFilter: string;
  searchQuery: string;
  onFilterChange: (value: string) => void;
  onSearch: (term: string) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            value={statusFilter}
            onValueChange={onFilterChange}
            placeholder="Todos los estados"
            triggerClassName="w-[180px]"
            options={[
              { value: "all", label: "Todos los estados" },
              { value: "active", label: "Activo" },
              { value: "inactive", label: "Inactivo" },
            ]}
          />
          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Buscar por título, ID o descripción..."
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
                  'input[placeholder="Buscar por título, ID o descripción..."]',
                ) as HTMLInputElement;
                onSearch(input?.value || "");
              }}
            >
              Buscar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DesktopSlidersTable({ sliders, isSuperAdmin, isDeleting, onEdit, onDelete, pagination, onPageChange }: {
  sliders: Slideshow[];
  isSuperAdmin: boolean;
  isDeleting: string | null;
  onEdit: (s: Slideshow) => void;
  onDelete: (id: string) => void;
  pagination: PaginationProps;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card className="hidden lg:block">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead className="w-[120px]">Imagen</TableHead>
              {isSuperAdmin && <TableHead className="w-[120px]">Organización</TableHead>}
              <TableHead className="w-[220px]">Título</TableHead>
              <TableHead className="w-[100px]">Activo</TableHead>
              <TableHead className="w-[150px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sliders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No se encontraron carruseles
                </TableCell>
              </TableRow>
            ) : (
              sliders.map((s) => (
                <TableRow key={s.id} className="group hover:bg-muted/50 transition-colors border-b border-border/50">
                  <TableCell className="font-mono text-[10px] text-muted-foreground tracking-tighter py-4">
                    #{s.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {s.img ? (
                      <div className="relative w-24 h-14 rounded-lg overflow-hidden shadow-sm border border-border group-hover:scale-105 transition-transform duration-500 bg-muted">
                        <Image src={s.img} alt={s.title} fill sizes="96px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-14 bg-muted rounded-lg flex items-center justify-center border border-border">
                        <ImageIcon className="size-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                        {s.tenantId}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="font-semibold text-sm">{s.title}</div>
                      {s.desc && (
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                          {s.desc}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.active ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-none text-[10px] font-bold uppercase tracking-wider">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted border-none shadow-none text-[10px] font-bold uppercase tracking-wider">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" aria-label="Editar slider" variant="ghost" className="size-8 rounded-full hover:bg-primary/5 hover:text-primary" onClick={() => onEdit(s)} disabled={isDeleting === s.id}>
                        {isDeleting === s.id ? <Spinner className="size-4" /> : <Edit className="size-4" />}
                      </Button>
                      <Button size="icon" aria-label="Eliminar slider" variant="ghost" className="size-8 rounded-full hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(s.id)} disabled={isDeleting === s.id}>
                        {isDeleting === s.id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination pagination={pagination} onPageChange={onPageChange} />
    </Card>
  );
}

function MobileSlidersCards({ sliders, onEdit, onDelete, pagination, onPageChange }: {
  sliders: Slideshow[];
  isDeleting: string | null;
  onEdit: (s: Slideshow) => void;
  onDelete: (id: string) => void;
  pagination: PaginationProps;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="space-y-4 lg:hidden">
      {sliders.map((s) => (
        <Card key={s.id} className="t-card overflow-hidden">
          <CardContent className="p-0">
            {s.img ? (
              <div className="relative w-full h-40 bg-muted">
                <Image src={s.img} alt={s.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              </div>
            ) : (
              <div className="w-full h-40 bg-muted flex items-center justify-center">
                <ImageIcon className="size-10 text-muted-foreground/30" />
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-lg leading-tight">{s.title}</h3>
                  {s.desc && <p className="text-sm text-muted-foreground font-medium">{s.desc}</p>}
                  <p className="text-[10px] font-medium text-muted-foreground font-mono">ID: #{s.id.slice(0, 8)}</p>
                </div>
                {s.active ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
                    Activo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted rounded-full font-bold text-[10px] uppercase tracking-wider">
                    Inactivo
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button size="sm" variant="outline" className="flex-1 font-semibold h-10" onClick={() => onEdit(s)}>
                  <Edit className="size-4 mr-2" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 font-semibold h-10 text-rose-600 border-rose-100 hover:bg-rose-50" onClick={() => onDelete(s.id)}>
                  <Trash2 className="size-4 mr-2" /> Eliminar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <MobileTablePagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}

function CreateSliderDialog({ open, form, imagePreview, isCreating, onOpenChange, onFormChange, onImagePreviewChange, onImageUpload, onCreate }: {
  open: boolean;
  form: { title: string; desc: string; active: boolean; img: string };
  imagePreview: string;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (f: { title: string; desc: string; active: boolean; img: string } | ((prev: { title: string; desc: string; active: boolean; img: string }) => { title: string; desc: string; active: boolean; img: string })) => void;
  onImagePreviewChange: (preview: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar carrusel</DialogTitle>
        </DialogHeader>
        <SliderFormFields form={form} setForm={onFormChange} imagePreview={imagePreview} prefix="create" onImageUpload={onImageUpload} />
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); onImagePreviewChange(""); }}>
            Cancelar
          </Button>
          <Button onClick={onCreate} disabled={isCreating}>
            {isCreating ? <><Spinner className="mr-2" /> Creando…</> : "Crear carrusel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditSliderDialog({ open, form, imagePreview, isEditing, onOpenChange, onFormChange, onImagePreviewChange, onImageUpload, onSave }: {
  open: boolean;
  form: { title: string; desc: string; active: boolean; img: string };
  imagePreview: string;
  isEditing: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (f: { title: string; desc: string; active: boolean; img: string } | ((prev: { title: string; desc: string; active: boolean; img: string }) => { title: string; desc: string; active: boolean; img: string })) => void;
  onImagePreviewChange: (preview: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar carrusel</DialogTitle>
        </DialogHeader>
        <SliderFormFields form={form} setForm={onFormChange} imagePreview={imagePreview} prefix="edit" onImageUpload={onImageUpload} />
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); onImagePreviewChange(""); }}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isEditing}>
            {isEditing ? <><Spinner className="mr-2" /> Guardando…</> : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageHeader({ isSuperAdmin, tenantFilter, onTenantFilterChange, onAddClick }: {
  isSuperAdmin: boolean;
  tenantFilter: string;
  onTenantFilterChange: (value: string) => void;
  onAddClick: () => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-medium">Gestión de carruseles</h2>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {isSuperAdmin && (
          <Select value={tenantFilter} onValueChange={onTenantFilterChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Todos los tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tenants</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button onClick={onAddClick}>
          <Plus className="size-4 mr-2" /> Agregar carrusel
        </Button>
      </div>
    </div>
  );
}

function SlidersTableClientInner({
  sliders: initialSliders,
  stats,
  pagination,
  isSuperAdmin = false,
}: Props) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm, ConfirmDialog } = useConfirm();

  const [sliders, setSliders] = useState<Slideshow[]>(() => initialSliders);
  const loadingRef = useRef(false);

  const tenantFilter = searchParams.get("tenantId") || "all";

  const _loadSliders = useCallback(async () => {
    try {
      loadingRef.current = true;
      const data = await slidersService.getAll(
        tenantFilter === "all" ? undefined : tenantFilter,
      );
      setSliders(data);
    } catch (err) {
      console.error("Error loading sliders:", err);
      toast.error("Error al cargar los sliders");
    } finally {
      loadingRef.current = false;
    }
  }, [tenantFilter]);

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

  const editingRef = useRef<Slideshow | null>(null);
  const [dialogState, dispatch] = useReducer(slidersDialogReducer, {
    createOpen: false,
    editOpen: false,
    form: { title: "", desc: "", active: true, img: "" },
    imagePreview: "",
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

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        isEdit: boolean = false,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (isEdit) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (editingRef.current)
                    editingRef.current = {
                        ...editingRef.current,
                        img: result,
                    } as any;
      dispatch({ type: "SET_IMAGE_PREVIEW", payload: result });
      } else {
        dispatch({ type: "SET_FORM", payload: { ...dialogState.form, img: result } });
        dispatch({ type: "SET_IMAGE_PREVIEW", payload: result });
            }
        };
        reader.readAsDataURL(file);
    };

  const createSlider = async () => {
    if (!dialogState.form.title) {
      toast.error("El título es obligatorio");
      return;
    }
    dispatch({ type: "SET_IS_CREATING", payload: true });
    try {
      const res = await fetch("/api/slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dialogState.form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Error al crear el slider");
        return;
      }
      toast.success("Carrusel creado");
      dispatch({ type: "SET_CREATE_OPEN", payload: false });
      dispatch({ type: "SET_FORM", payload: { title: "", desc: "", active: true, img: "" } });
      dispatch({ type: "SET_IMAGE_PREVIEW", payload: "" });
      router.refresh();
    } catch {
      toast.error("Error de red");
    } finally {
      dispatch({ type: "SET_IS_CREATING", payload: false });
    }
  };

    const deleteSlider = async (id: string) => {
        const confirmed = await confirm({
            title: "Eliminar Slider",
            description:
                "¿Seguro que querés eliminar este slider? Esta acción no se puede deshacer.",
            confirmText: "Eliminar",
            variant: "destructive",
        });
        if (!confirmed) return;
        dispatch({ type: "SET_IS_DELETING", payload: id });
        try {
            const res = await fetch(`/api/slide/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                toast.error("Error al eliminar");
                return;
            }
            toast.success("Carrusel eliminado");
            router.refresh();
        } catch {
            toast.error("Error de red");
        } finally {
            dispatch({ type: "SET_IS_DELETING", payload: null });
        }
    };

  const openEdit = (s: Slideshow) => {
    editingRef.current = s;
    dispatch({ type: "SET_FORM", payload: {
      title: s.title,
      desc: s.desc || "",
      active: s.active ?? true,
      img: "",
    } });
    dispatch({ type: "SET_IMAGE_PREVIEW", payload: s.img || "" });
    dispatch({ type: "SET_EDIT_OPEN", payload: true });
  };

  const saveEdit = async () => {
    if (!editingRef.current) return;
    dispatch({ type: "SET_IS_EDITING", payload: true });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = {
        ...editingRef.current,
        title: dialogState.form.title,
        desc: dialogState.form.desc,
        active: dialogState.form.active,
      };
      if (dialogState.form.img) {
        body.img = dialogState.form.img;
      }
      // In edit mode, handleImageUpload updates editingRef.current.img
      // So `body` already has updated `img` from `...editingRef.current`.

      const res = await fetch(`/api/slide/${editingRef.current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Error al actualizar");
        return;
      }
      toast.success("Carrusel actualizado");
      dispatch({ type: "SET_EDIT_OPEN", payload: false });
      editingRef.current = null;
      dispatch({ type: "SET_FORM", payload: { title: "", desc: "", active: true, img: "" } });
      dispatch({ type: "SET_IMAGE_PREVIEW", payload: "" });
      router.refresh();
    } catch {
      toast.error("Error de red");
    } finally {
      dispatch({ type: "SET_IS_EDITING", payload: false });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="w-full space-y-6" suppressHydrationWarning>
      <PageHeader
        isSuperAdmin={isSuperAdmin}
        tenantFilter={tenantFilter}
        onTenantFilterChange={handleTenantFilterChange}
      onAddClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: true })}
      />

      <StatsSection stats={stats} />

      <FilterBar statusFilter={statusFilter} searchQuery={searchQuery} onFilterChange={handleFilterChange} onSearch={handleSearch} />

      <DesktopSlidersTable
        sliders={sliders}
        isSuperAdmin={isSuperAdmin}
        isDeleting={dialogState.isDeleting}
        onEdit={openEdit}
        onDelete={deleteSlider}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      <MobileSlidersCards
        sliders={sliders}
        isDeleting={dialogState.isDeleting}
        onEdit={openEdit}
        onDelete={deleteSlider}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      <CreateSliderDialog
        open={dialogState.createOpen}
        form={dialogState.form}
        imagePreview={dialogState.imagePreview}
        isCreating={dialogState.isCreating}
        onOpenChange={(open) => dispatch({ type: "SET_CREATE_OPEN", payload: open })}
        onFormChange={(f) => dispatch({ type: "SET_FORM", payload: typeof f === "function" ? f(dialogState.form) : f })}
        onImagePreviewChange={(p) => dispatch({ type: "SET_IMAGE_PREVIEW", payload: p })}
        onImageUpload={handleImageUpload}
        onCreate={createSlider}
      />

      <EditSliderDialog
        open={dialogState.editOpen}
        form={dialogState.form}
        imagePreview={dialogState.imagePreview}
        isEditing={dialogState.isEditing}
        onOpenChange={(open) => dispatch({ type: "SET_EDIT_OPEN", payload: open })}
        onFormChange={(f) => dispatch({ type: "SET_FORM", payload: typeof f === "function" ? f(dialogState.form) : f })}
        onImagePreviewChange={(p) => dispatch({ type: "SET_IMAGE_PREVIEW", payload: p })}
        onImageUpload={handleImageUpload}
      onSave={saveEdit}
      />

      <ConfirmDialog />
      </div>
    );
  }

export default function SlidersTableClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <SlidersTableClientInner {...props} />
    </Suspense>
  );
}
