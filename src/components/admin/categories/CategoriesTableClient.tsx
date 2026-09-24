"use client";

import React, { Suspense, useRef, useReducer, useSyncExternalStore } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api-client";

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
          <Icon className="size-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const CategoryFormFields = ({
  form,
  setForm,
  prefix,
}: {
  form: { name: string; description: string; type: string };
  setForm: (form: { name: string; description: string; type: string }) => void;
  prefix: string;
}) => (
  <div className="space-y-4">
    <div>
      <label htmlFor={`${prefix}-name`} className="text-sm font-medium">Nombre</label>
      <Input id={`${prefix}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre de la categoría" />
    </div>
    <div>
      <label htmlFor={`${prefix}-description`} className="text-sm font-medium">Descripción</label>
      <Input id={`${prefix}-description`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción opcional" />
    </div>
    <div>
      <label htmlFor={`${prefix}-type`} className="text-sm font-medium">Tipo</label>
      <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
        <SelectTrigger id={`${prefix}-type`}>
          <SelectValue placeholder="Seleccionar tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PRODUCT">Producto</SelectItem>
          <SelectItem value="SERVICE">Servicio</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

type CategoriesDialogState = {
  createOpen: boolean;
  editOpen: boolean;
  form: { name: string; description: string; type: string };
  isCreating: boolean;
  isEditing: boolean;
  isDeleting: string | null;
};

type CategoriesDialogAction =
  | { type: "SET_CREATE_OPEN"; payload: boolean }
  | { type: "SET_EDIT_OPEN"; payload: boolean }
  | { type: "SET_FORM"; payload: CategoriesDialogState["form"] }
  | { type: "SET_IS_CREATING"; payload: boolean }
  | { type: "SET_IS_EDITING"; payload: boolean }
  | { type: "SET_IS_DELETING"; payload: string | null };

function categoriesDialogReducer(state: CategoriesDialogState, action: CategoriesDialogAction): CategoriesDialogState {
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

const emptySubscribe = () => () => {};

const CategoriesDesktopStats = ({ stats }: { stats: Stats }) => (
  <div className="hidden md:grid md:grid-cols-3 gap-4">
    <StatCard
      icon={Folder}
      title="Total de Categorías"
      value={stats.totalCategories}
      color="bg-primary/10 text-primary"
    />
    <StatCard
      icon={Package}
      title="Total de Productos"
      value={stats.totalProducts}
      color="bg-accent text-accent-foreground"
    />
    <StatCard
      icon={TrendingUp}
      title="Prom. Productos/Categoría"
      value={stats.averageProductsPerCategory}
      color="bg-muted text-muted-foreground"
    />
  </div>
);

const CategoriesMobileStats = ({ stats }: { stats: Stats }) => (
  <Accordion type="single" collapsible className="w-full md:hidden">
    <AccordionItem value="stats" className="border rounded-lg">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <Folder className="size-5 text-muted-foreground" />
          <span className="font-medium">
            Estadísticas de categorías
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <div className="grid grid-cols-1 gap-4">
          <StatCard
            icon={Folder}
            title="Total de Categorías"
            value={stats.totalCategories}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={Package}
            title="Total de Productos"
            value={stats.totalProducts}
            color="bg-accent text-accent-foreground"
          />
          <StatCard
            icon={TrendingUp}
            title="Prom. Productos/Categoría"
            value={stats.averageProductsPerCategory}
            color="bg-muted text-muted-foreground"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

const CategoriesSearchBar = ({
  searchQuery,
  onSearch,
  typeFilter,
  onTypeFilterChange,
  tenantFilter,
  onTenantFilterChange,
  isSuperAdmin,
}: {
  searchQuery: string;
  onSearch: (term: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  tenantFilter: string;
  onTenantFilterChange: (tenant: string) => void;
  isSuperAdmin: boolean;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nombre, ID o descripción..."
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
              'input[placeholder="Buscar por nombre, ID o descripción..."]',
            ) as HTMLInputElement;
            onSearch(input?.value || "");
          }}
        >
          Buscar
        </Button>

        <div className="w-[180px]">
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="PRODUCT">Producto</SelectItem>
              <SelectItem value="SERVICE">Servicio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isSuperAdmin && (
          <div className="w-[180px]">
            <Select
              value={tenantFilter}
              onValueChange={onTenantFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todos los tenants
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const CategoriesDesktopTable = ({
  categories,
  isSuperAdmin,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  isDeleting,
}: {
  categories: CategoryWithCount[];
  isSuperAdmin: boolean;
  pagination: PaginationProps;
  onPageChange: (page: number) => void;
  onEdit: (c: CategoryWithCount) => void;
  onDelete: (id: string) => void;
  isDeleting: string | null;
}) => (
  <Card className="hidden md:block">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">ID</TableHead>
            <TableHead className="w-[200px]">
              Nombre
            </TableHead>
            <TableHead className="w-[300px]">
              Descripción
            </TableHead>
            <TableHead className="w-[100px]">
              Tipo
            </TableHead>
            {isSuperAdmin && (
              <TableHead className="w-[100px]">
                Organización
              </TableHead>
            )}
            <TableHead className="w-[100px]">
              Productos
            </TableHead>
            <TableHead className="w-[150px]">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                No se encontraron categorías
              </TableCell>
            </TableRow>
          ) : (
            categories.map((c) => (
              <TableRow
                key={c.id}
                className="group hover:bg-muted/50 transition-colors border-b border-border/50"
              >
                <TableCell className="font-mono text-[10px] text-muted-foreground tracking-tighter py-4">
                  #{c.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-sm">
                    {c.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground font-medium line-clamp-1 max-w-[300px]">
                    {c.description || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.type === "SERVICE"
                        ? "default"
                        : "secondary"
                    }
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {c.type}
                  </Badge>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {c.tenant?.name || "—"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <span className="text-xs font-bold">
                        {c.productCount || 0}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Productos
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full hover:bg-primary/5 hover:text-primary"
                      onClick={() => onEdit(c)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full hover:bg-destructive/5 hover:text-destructive"
                      onClick={() =>
                        onDelete(c.id)
                      }
                      disabled={
                        isDeleting === c.id
                      }
                    >
                      {isDeleting === c.id ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
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
          Mostrando{" "}
          {(pagination.currentPage - 1) *
            pagination.itemsPerPage +
            1}{" "}
          a{" "}
          {Math.min(
            pagination.currentPage *
              pagination.itemsPerPage,
            pagination.totalItems,
          )}{" "}
          de {pagination.totalItems} resultados
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onPageChange(pagination.currentPage - 1)
            }
            disabled={pagination.currentPage === 1}
          >
            <ChevronLeft className="size-4 mr-1" />
            Anterior
          </Button>
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-sm text-muted-foreground px-2">
              Página {pagination.currentPage} de{" "}
              {pagination.totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onPageChange(pagination.currentPage + 1)
            }
            disabled={
              pagination.currentPage ===
              pagination.totalPages || pagination.totalPages === 0
            }
          >
            Siguiente
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </div>
    )}
  </Card>
);

const CategoriesMobileCards = ({
  categories,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  isDeleting,
}: {
  categories: CategoryWithCount[];
  pagination: PaginationProps;
  onPageChange: (page: number) => void;
  onEdit: (c: CategoryWithCount) => void;
  onDelete: (id: string) => void;
  isDeleting: string | null;
}) => (
  <div className="space-y-4 md:hidden">
    {categories.map((c) => (
      <Card key={c.id} className="t-card overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-lg tracking-tight text-foreground">
                {c.name}
              </h3>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                ID: #{c.id.slice(0, 8)}
              </p>
            </div>
            <Badge
              variant={
                c.type === "SERVICE"
                  ? "default"
                  : "secondary"
              }
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              {c.type}
            </Badge>
          </div>

          {c.description && (
            <p className="text-sm font-medium text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4">
              {c.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <span className="text-xs font-bold">
                  {c.productCount || 0}
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Productos
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="size-10 rounded-lg"
                onClick={() => onEdit(c)}
              >
                <Edit className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="size-10 border-destructive/20 text-destructive rounded-lg hover:bg-destructive/10"
                onClick={() => onDelete(c.id)}
                disabled={isDeleting === c.id}
              >
                {isDeleting === c.id ? (
                  <Spinner className="size-4" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}

    {pagination.totalItems > 0 && (
      <Card className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onPageChange(pagination.currentPage - 1)
            }
            disabled={pagination.currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.currentPage} de{" "}
            {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onPageChange(pagination.currentPage + 1)
            }
            disabled={
              pagination.currentPage ===
              pagination.totalPages || pagination.totalPages === 0
            }
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </Card>
    )}
  </div>
);

const CreateCategoryDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { name: string; description: string; type: string };
  setForm: (form: { name: string; description: string; type: string }) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Agregar categoría</DialogTitle>
      </DialogHeader>
      <CategoryFormFields form={form} setForm={setForm} prefix="create-category" />
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" /> Creando…
            </>
          ) : (
            "Crear Categoría"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const EditCategoryDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { name: string; description: string; type: string };
  setForm: (form: { name: string; description: string; type: string }) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Editar categoría</DialogTitle>
      </DialogHeader>
      <CategoryFormFields form={form} setForm={setForm} prefix="edit-category" />
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" /> Guardando…
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default function CategoriesTableClient(props: Props) {
  return (
    <Suspense fallback={<div className="p-6" />}>
      <CategoriesTableClientInner {...props} />
    </Suspense>
  );
}

function CategoriesTableClientInner({
  categories,
  stats,
  pagination,
  isSuperAdmin = false,
}: Props) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm, ConfirmDialog } = useConfirm();

  const [dialogState, dispatch] = useReducer(categoriesDialogReducer, {
    createOpen: false,
    editOpen: false,
    form: { name: "", description: "", type: "PRODUCT" },
    isCreating: false,
    isEditing: false,
    isDeleting: null,
  });
  const editingRef = useRef<CategoryWithCount | null>(null);

  const searchQuery = searchParams.get("search") || "";
  const typeFilter = searchParams.get("type") || "all";
  const tenantFilter = searchParams.get("tenantId") || "all";

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

  const handleTypeFilterChange = (newType: string) => {
    const params = new URLSearchParams(searchParams);
    if (newType && newType !== "all") {
      params.set("type", newType);
    } else {
      params.delete("type");
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

  const createCategory = async () => {
    if (!dialogState.form.name) {
      toast.error("El nombre es obligatorio");
      return;
    }
    dispatch({ type: "SET_IS_CREATING", payload: true });
    try {
      await api.post("/categories", dialogState.form);
      toast.success("Categoría creada");
      dispatch({ type: "SET_CREATE_OPEN", payload: false });
      dispatch({ type: "SET_FORM", payload: { name: "", description: "", type: "PRODUCT" } });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al crear la categoría");
    } finally {
      dispatch({ type: "SET_IS_CREATING", payload: false });
    }
  };

  const deleteCategory = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar Categoría",
      description:
        "¿Seguro que querés eliminar esta categoría? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;
    dispatch({ type: "SET_IS_DELETING", payload: id });
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Categoría eliminada");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    } finally {
      dispatch({ type: "SET_IS_DELETING", payload: null });
    }
  };

  const openEdit = (c: CategoryWithCount) => {
    editingRef.current = c;
    dispatch({
      type: "SET_FORM",
      payload: {
        name: c.name,
        description: c.description || "",
        type: c.type || "PRODUCT",
      },
    });
    dispatch({ type: "SET_EDIT_OPEN", payload: true });
  };

  const saveEdit = async () => {
    if (!editingRef.current) return;
    dispatch({ type: "SET_IS_EDITING", payload: true });
    try {
      await api.put(`/categories/${editingRef.current.id}`, dialogState.form);
      toast.success("Categoría actualizada");
      dispatch({ type: "SET_EDIT_OPEN", payload: false });
      editingRef.current = null;
      dispatch({ type: "SET_FORM", payload: { name: "", description: "", type: "PRODUCT" } });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    } finally {
      dispatch({ type: "SET_IS_EDITING", payload: false });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="w-full space-y-6" suppressHydrationWarning>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Gestión de categorías</h2>
        <Button onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: true })}>
          <Plus className="size-4 mr-2" />
          Agregar categoría
        </Button>
      </div>

      <CategoriesDesktopStats stats={stats} />
      <CategoriesMobileStats stats={stats} />
      <CategoriesSearchBar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        tenantFilter={tenantFilter}
        onTenantFilterChange={handleTenantFilterChange}
        isSuperAdmin={isSuperAdmin}
      />
      <CategoriesDesktopTable
        categories={categories}
        isSuperAdmin={isSuperAdmin}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={openEdit}
        onDelete={deleteCategory}
        isDeleting={dialogState.isDeleting}
      />
      <CategoriesMobileCards
        categories={categories}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={openEdit}
        onDelete={deleteCategory}
        isDeleting={dialogState.isDeleting}
      />
      <CreateCategoryDialog
        open={dialogState.createOpen}
        onOpenChange={(open) => dispatch({ type: "SET_CREATE_OPEN", payload: open })}
        form={dialogState.form}
        setForm={(f) => dispatch({ type: "SET_FORM", payload: f })}
        onSubmit={createCategory}
        isSubmitting={dialogState.isCreating}
      />
      <EditCategoryDialog
        open={dialogState.editOpen}
        onOpenChange={(open) => dispatch({ type: "SET_EDIT_OPEN", payload: open })}
        form={dialogState.form}
        setForm={(f) => dispatch({ type: "SET_FORM", payload: f })}
        onSubmit={saveEdit}
        isSubmitting={dialogState.isEditing}
      />
      <ConfirmDialog />
    </div>
  );
}
