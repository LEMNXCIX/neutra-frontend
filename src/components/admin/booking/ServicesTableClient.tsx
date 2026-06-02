"use client";

import React, { useReducer, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Clock, DollarSign, Tag, Info } from "lucide-react";
import { bookingService, Service } from "@/services/booking.service";
import { categoriesService } from "@/services/categories.service";
import { Category } from "@/types/category.types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
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
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/hooks/use-confirm";

type ServicesState = {
  services: Service[];
  loading: boolean;
  dialogOpen: boolean;
  isSaving: boolean;
  editingService: Service | null;
  categories: Category[];
  loadingCategories: boolean;
  formData: {
    name: string;
    description: string;
    duration: number;
    price: number;
    categoryId: string;
    active: boolean;
  };
};

type ServicesAction =
  | { type: "SET_SERVICES"; payload: Service[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_IS_SAVING"; payload: boolean }
  | { type: "SET_EDITING_SERVICE"; payload: Service | null }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_LOADING_CATEGORIES"; payload: boolean }
  | { type: "SET_FORM_DATA"; payload: ServicesState["formData"] };

function servicesReducer(state: ServicesState, action: ServicesAction): ServicesState {
  switch (action.type) {
    case "SET_SERVICES":
      return { ...state, services: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_DIALOG_OPEN":
      return { ...state, dialogOpen: action.payload };
    case "SET_IS_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_EDITING_SERVICE":
      return { ...state, editingService: action.payload };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SET_LOADING_CATEGORIES":
      return { ...state, loadingCategories: action.payload };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    default:
      return state;
  }
}

interface Props {
  services: Service[];
  categories: Category[];
  isSuperAdmin?: boolean;
}

function ServiceFormFields({
  formData,
  setFormData,
  categories,
  loadingCategories,
}: {
  formData: { name: string; description: string; duration: number; price: number; categoryId: string; active: boolean };
  setFormData: (fd: typeof formData | ((prev: typeof formData) => typeof formData)) => void;
  categories: Category[];
  loadingCategories: boolean;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="name">Service Name *</Label>
        <Input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Consultation"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this service includes..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="duration">Duration (min) *</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              id="duration"
              type="number"
              required
              min="1"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="pl-9"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price">Price ($) *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              id="price"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="pl-9"
            />
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="categoryId">Category (Optional)</Label>
        <Select
          value={formData.categoryId || "none"}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value === "none" ? "" : value })}
        >
          <SelectTrigger id="categoryId" className="w-full">
            <div className="flex items-center">
              <Tag className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select a category" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Uncategorized)</SelectItem>
            {(Array.isArray(categories) ? categories : []).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
            {(!Array.isArray(categories) || categories.length === 0) && !loadingCategories && (
              <div className="p-2 text-xs text-center text-muted-foreground">No service categories found.</div>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
        <div className="space-y-0.5">
          <Label htmlFor="active" className="text-sm font-medium">Active Status</Label>
          <p className="text-xs text-muted-foreground">Show this service to customers</p>
        </div>
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
      </div>
    </>
  );
}

type FormDataType = ServicesState["formData"];

function ServicesHeader({
  isSuperAdmin,
  tenantFilter,
  onTenantFilterChange,
  onCreate,
}: {
  isSuperAdmin: boolean;
  tenantFilter: string;
  onTenantFilterChange: (value: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Services
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage the services offered by your booking system.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {isSuperAdmin && (
          <Select
            value={tenantFilter}
            onValueChange={onTenantFilterChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button onClick={onCreate} className="w-full sm:w-auto">
          <Plus className="size-4 mr-2" />
          Add Service
        </Button>
      </div>
    </div>
  );
}

function ServicesMobileCards({
  services,
  onEdit,
  onDelete,
}: {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {services.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No services found. Create your first service to get
            started.
          </CardContent>
        </Card>
      ) : (
        services.map((service) => (
          <Card key={service.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold">
                    {service.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {service.category ? (
                      <Badge
                        variant="outline"
                        className="font-normal capitalize text-xs"
                      >
                        <Tag className="size-3 mr-1 opacity-70" />
                        {service.category.name}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="font-normal text-xs text-muted-foreground"
                      >
                        Uncategorized
                      </Badge>
                    )}
                    <Badge
                      variant={
                        service.active
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {service.active
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="font-bold text-primary text-lg">
                  ${service.price.toFixed(2)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2 text-sm space-y-2">
              {service.description && (
                <p className="text-muted-foreground line-clamp-2 italic">
                  "{service.description}"
                </p>
              )}
              <div className="flex items-center text-muted-foreground pt-1">
                <Clock className="size-4 mr-2" />
                {service.duration} min
              </div>
            </CardContent>
            <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onEdit(service)}
              >
                <Edit className="size-4 mr-2" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => onDelete(service.id)}
              >
                <Trash2 className="size-4 mr-2" /> Delete
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function ServicesDesktopTable({
  services,
  isSuperAdmin,
  onEdit,
  onDelete,
}: {
  services: Service[];
  isSuperAdmin: boolean;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="hidden md:block">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">
                Service Details
              </TableHead>
              <TableHead className="font-semibold">
                Category
              </TableHead>
              {isSuperAdmin && (
                <TableHead className="font-semibold">
                  Tenant
                </TableHead>
              )}
              <TableHead className="font-semibold">
                Duration
              </TableHead>
              <TableHead className="font-semibold">
                Price
              </TableHead>
              <TableHead className="font-semibold">
                Status
              </TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  No services found. Create your first
                  service to get started.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow
                  key={service.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-base">
                        {service.name}
                      </span>
                      {service.description && (
                        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                          {service.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.category ? (
                      <Badge
                        variant="outline"
                        className="font-normal capitalize"
                      >
                        <Tag className="size-3 mr-1 opacity-70" />
                        {service.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">
                        Uncategorized
                      </span>
                    )}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] uppercase"
                      >
                        {service.tenantId}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="size-3.5 mr-1.5 opacity-70" />
                      {service.duration} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center font-semibold text-primary">
                      <DollarSign className="size-3.5 mr-0.5" />
                      {service.price.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        service.active
                          ? "default"
                          : "secondary"
                      }
                    >
                      {service.active
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() =>
                          onEdit(service)
                        }
                      >
                        <Edit className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() =>
                          onDelete(service.id)
                        }
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ServicesFormDialog({
  dialogOpen,
  isSaving,
  editingService,
  formData,
  setFormData,
  categories,
  loadingCategories,
  onOpenChange,
  onSubmit,
}: {
  dialogOpen: boolean;
  isSaving: boolean;
  editingService: Service | null;
  formData: FormDataType;
  setFormData: (fd: FormDataType | ((prev: FormDataType) => FormDataType)) => void;
  categories: Category[];
  loadingCategories: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingService
              ? "Edit Service"
              : "Add New Service"}
          </DialogTitle>
          <DialogDescription>
            {editingService
              ? "Modify the service details below."
              : "Define the details of the service you want to offer."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5 pt-4">
          <ServiceFormFields formData={formData} setFormData={setFormData} categories={categories} loadingCategories={loadingCategories} />
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : editingService
                ? "Update Service"
                : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ServicesTableClientInner({
  services: initialServices,
  categories: initialCategories,
  isSuperAdmin = false,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(servicesReducer, {
    services: initialServices || [],
    loading: false,
    dialogOpen: false,
    isSaving: false,
    editingService: null,
    categories: Array.isArray(initialCategories) ? initialCategories : [],
    loadingCategories: false,
    formData: {
      name: "",
      description: "",
      duration: 30,
      price: 0,
      categoryId: "",
      active: true,
    },
  });
  const { services, loading, dialogOpen, isSaving, editingService, categories, loadingCategories, formData } = state;
  const setFormData = (updater: any) => {
    const next = typeof updater === "function" ? updater(formData) : updater;
    dispatch({ type: "SET_FORM_DATA", payload: next });
  };
  const { confirm, ConfirmDialog } = useConfirm();

  const tenantFilter = searchParams.get("tenantId") || "all";

  const loadCategories = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING_CATEGORIES", payload: true });
      const data = await categoriesService.getAll();
      dispatch({ type: "SET_CATEGORIES", payload: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error("Error loading categories:", err);
      dispatch({ type: "SET_CATEGORIES", payload: [] });
    } finally {
      dispatch({ type: "SET_LOADING_CATEGORIES", payload: false });
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

    const handleTenantFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === "all") {
            params.delete("tenantId");
        } else {
            params.set("tenantId", value);
        }
        router.push(`?${params.toString()}`);
    };

    const loadServices = async () => {
        try {
      dispatch({ type: "SET_LOADING", payload: true });
      const data = await bookingService.getServices(
                false,
                tenantFilter === "all" ? undefined : tenantFilter,
            );
      dispatch({ type: "SET_SERVICES", payload: data });
    } catch (err) {
      console.error("Error loading services:", err);
      toast.error("Failed to load services");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    const openCreate = () => {
    dispatch({ type: "SET_EDITING_SERVICE", payload: null });
dispatch({ type: "SET_FORM_DATA", payload: {
    name: "",
    description: "",
    duration: 30,
    price: 0,
    categoryId: "",
    active: true,
  }});
  dispatch({ type: "SET_DIALOG_OPEN", payload: true });
  };

  const openEdit = (service: Service) => {
    dispatch({ type: "SET_EDITING_SERVICE", payload: service });
dispatch({ type: "SET_FORM_DATA", payload: {
    name: service.name,
    description: service.description || "",
    duration: service.duration,
    price: service.price,
    categoryId: service.categoryId || "",
    active: service.active,
  }});
  dispatch({ type: "SET_DIALOG_OPEN", payload: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_IS_SAVING", payload: true });

        try {
      const url = editingService
      ? `/api/services/${editingService.id}`
      : "/api/services";
    const method = editingService ? "PUT" : "POST";

    const payload = {
      ...formData,
      categoryId:
        formData.categoryId === "" ? null : formData.categoryId,
    };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
      toast.success(
        `Service ${editingService ? "updated" : "created"} successfully`,
      );
      dispatch({ type: "SET_DIALOG_OPEN", payload: false });
      await loadServices();
    } else {
      const errorData = await response.json();
      toast.error(
        errorData.message ||
        `Failed to ${editingService ? "update" : "create"} service`,
      );
    }
  } catch (err) {
    console.error(
      `Error ${editingService ? "updating" : "creating"} service:`,
      err,
            );
            toast.error("An unexpected error occurred");
        } finally {
            dispatch({ type: "SET_IS_SAVING", payload: false });
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Service",
            description:
                "Are you sure you want to delete this service? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/services/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Service deleted successfully");
                await loadServices();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to delete service");
            }
        } catch (err) {
            console.error("Error deleting service:", err);
            toast.error("An unexpected error occurred");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Spinner className="size-8 text-primary" />
                <p className="text-muted-foreground animate-pulse">
                    Loading services…
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ConfirmDialog />
    <ServicesHeader
      isSuperAdmin={isSuperAdmin}
      tenantFilter={tenantFilter}
      onTenantFilterChange={handleTenantFilterChange}
      onCreate={openCreate}
    />

    <ServicesMobileCards
      services={services}
      onEdit={openEdit}
      onDelete={handleDelete}
    />

    <ServicesDesktopTable
      services={services}
      isSuperAdmin={isSuperAdmin}
      onEdit={openEdit}
      onDelete={handleDelete}
    />

    <ServicesFormDialog
      dialogOpen={dialogOpen}
      isSaving={isSaving}
      editingService={editingService}
      formData={formData}
      setFormData={setFormData}
      categories={categories}
      loadingCategories={loadingCategories}
      onOpenChange={(open: boolean) => {
        if (!isSaving) dispatch({ type: "SET_DIALOG_OPEN", payload: open });
      }}
      onSubmit={handleSubmit}
    />
      </div>
    );
  }

export default function ServicesTableClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <ServicesTableClientInner {...props} />
    </Suspense>
  );
}
