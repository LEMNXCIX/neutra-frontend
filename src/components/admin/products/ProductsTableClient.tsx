"use client";

import React, { Suspense, useRef, useReducer } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
    Upload,
    X,
    Edit,
    Trash2,
    Plus,
    Package,
    DollarSign,
    AlertTriangle,
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
import { cn } from "@/lib/utils";
import { Product } from "@/types/product.types";

const getStockBadge = (stock: number) => {
    if (stock === 0)
        return (
            <Badge
                variant="destructive"
                className="rounded-full shadow-none border-none bg-rose-100 text-rose-700 hover:bg-rose-100"
            >
                Out of Stock
            </Badge>
        );
    if (stock < 10)
        return (
            <Badge className="rounded-full shadow-none border-none bg-amber-100 text-amber-700 hover:bg-amber-100">
                Low Stock
            </Badge>
        );
    return (
        <Badge className="rounded-full shadow-none border-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            In Stock
        </Badge>
    );
};

type Stats = {
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
};

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
};

type Props = {
    products: Product[];
    stats: Stats;
    pagination: PaginationProps;
    categories: Array<{ id: string; name: string }>;
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

function ProductFormFields({
  form,
  setForm,
  preview,
  setPreview,
  categories,
  prefix,
  onImageUpload,
}: {
  form: { name: string; price: string; stock: string; category: string; imageBase64: string };
  setForm: (form: { name: string; price: string; stock: string; category: string; imageBase64: string }) => void;
  preview: string | null;
  setPreview: (preview: string | null) => void;
  categories: Array<{ id: string; name: string }>;
  prefix: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
}) {
  const isEdit = prefix === "edit";
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${prefix}-product-name`} className="text-sm font-medium">Name</label>
        <Input id={`${prefix}-product-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${prefix}-product-price`} className="text-sm font-medium">Price</label>
          <Input id={`${prefix}-product-price`} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
        </div>
        <div>
          <label htmlFor={`${prefix}-product-stock`} className="text-sm font-medium">Stock</label>
          <Input id={`${prefix}-product-stock`} type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
        </div>
      </div>
      <div>
        <label htmlFor={`${prefix}-product-category`} className="text-sm font-medium">Category</label>
        <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
          <SelectTrigger id={`${prefix}-product-category`}><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {(Array.isArray(categories) ? categories : []).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor={`${prefix}-product-image`} className="text-sm font-medium">Image</label>
        <div className="mt-2 flex items-center gap-3">
          {preview && (
            <div className="relative">
              <Image src={preview} alt="Preview" width={64} height={64} className="rounded object-cover" />
              <Button size="sm" variant="destructive" className="absolute -top-2 -right-2 size-6 rounded-full p-0" onClick={() => { setPreview(null); setForm({ ...form, imageBase64: "" }); }}>
                <X className="size-3" />
              </Button>
            </div>
          )}
          <label htmlFor={`${prefix}-product-image`} className="cursor-pointer">
            <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <Upload className="size-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{isEdit ? "Change Image" : "Upload Image"}</p>
            </div>
            <input id={`${prefix}-product-image`} type="file" accept="image/*" className="hidden" onChange={(e) => onImageUpload(e, isEdit)} />
          </label>
        </div>
      </div>
    </div>
  );
}

type ProductsDialogState = {
  createOpen: boolean;
  editOpen: boolean;
  form: { name: string; price: string; stock: string; category: string; imageBase64: string };
  preview: string | null;
  isCreating: boolean;
  isEditing: boolean;
  isDeleting: string | null;
};

type ProductsDialogAction =
  | { type: "SET_CREATE_OPEN"; payload: boolean }
  | { type: "SET_EDIT_OPEN"; payload: boolean }
  | { type: "SET_FORM"; payload: ProductsDialogState["form"] }
  | { type: "SET_PREVIEW"; payload: string | null }
  | { type: "SET_IS_CREATING"; payload: boolean }
  | { type: "SET_IS_EDITING"; payload: boolean }
  | { type: "SET_IS_DELETING"; payload: string | null };

function productsDialogReducer(state: ProductsDialogState, action: ProductsDialogAction): ProductsDialogState {
  switch (action.type) {
    case "SET_CREATE_OPEN":
      return { ...state, createOpen: action.payload };
    case "SET_EDIT_OPEN":
      return { ...state, editOpen: action.payload };
    case "SET_FORM":
      return { ...state, form: action.payload };
    case "SET_PREVIEW":
      return { ...state, preview: action.payload };
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

function ProductsDesktopTable({
  products,
  isSuperAdmin,
  openEdit,
  deleteProduct,
  isDeleting,
  pagination,
  handlePageChange,
}: {
  products: Product[];
  isSuperAdmin: boolean;
  openEdit: (p: Product) => void;
  deleteProduct: (id: string) => void;
  isDeleting: string | null;
  pagination: PaginationProps;
  handlePageChange: (page: number) => void;
}) {
  return (
    <Card className="hidden lg:block">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">
                Image
              </TableHead>
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead className="w-[200px]">
                Name
              </TableHead>
              <TableHead className="w-[120px]">
                Category
              </TableHead>
              {isSuperAdmin && (
                <TableHead className="w-[100px]">
                  Tenant
                </TableHead>
              )}
              <TableHead className="w-[100px]">
                Price
              </TableHead>
              <TableHead className="w-[80px]">
                Stock
              </TableHead>
              <TableHead className="w-[120px]">
                Status
              </TableHead>
              <TableHead className="w-[150px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow
                  key={p.id}
                  className="group hover:bg-muted/50 transition-colors border-b border-border/50"
                >
                  <TableCell className="py-4">
                    {p.image ? (
                      <div className="relative size-12 rounded-lg overflow-hidden shadow-sm border border-border group-hover:scale-110 transition-transform duration-500">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-12 bg-muted rounded-lg flex items-center justify-center border border-border">
                        <Package className="size-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground tracking-tighter">
                    #{p.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-sm">
                      {p.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.categories?.map((c) => (
                        <Badge
                          key={c.id}
                          variant="secondary"
                          className="text-[9px] font-bold uppercase tracking-wider"
                        >
                          {c.name}
                        </Badge>
                      )) || (
                        <span className="text-muted-foreground italic text-xs">
                          N/A
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-bold uppercase tracking-wider"
                      >
                        {p.tenantId}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="font-bold text-sm">
                      ${p.price.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm text-muted-foreground">
                      {p.stock || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStockBadge(p.stock || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full hover:bg-primary/5 hover:text-primary"
                        onClick={() => openEdit(p)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full hover:bg-destructive/5 hover:text-destructive"
                        onClick={() =>
                          deleteProduct(p.id)
                        }
                      >
                        <Trash2 className="size-4" />
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
            Showing{" "}
            {(pagination.currentPage - 1) *
              pagination.itemsPerPage +
              1}{" "}
            to{" "}
            {Math.min(
              pagination.currentPage *
                pagination.itemsPerPage,
              pagination.totalItems,
            )}{" "}
            of {pagination.totalItems} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(pagination.currentPage - 1)
              }
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-sm text-muted-foreground px-2">
                Page {pagination.currentPage} of{" "}
                {pagination.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(pagination.currentPage + 1)
              }
              disabled={
                pagination.currentPage ===
                  pagination.totalPages ||
                pagination.totalPages === 0
              }
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

function ProductsMobileCards({
  products,
  openEdit,
  deleteProduct,
  isDeleting,
  pagination,
  handlePageChange,
}: {
  products: Product[];
  openEdit: (p: Product) => void;
  deleteProduct: (id: string) => void;
  isDeleting: string | null;
  pagination: PaginationProps;
  handlePageChange: (page: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
      {products.map((p) => (
        <Card
          key={p.id}
          className="t-card overflow-hidden group border-none"
        >
          <div className="aspect-square bg-muted relative overflow-hidden">
            {p.image ? (
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform group-hover:scale-110 duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="size-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base line-clamp-1 text-foreground">
                {p.name}
              </h3>
              <p className="text-[10px] font-medium text-muted-foreground font-mono">
                ID: #{p.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-primary">
                ${p.price.toFixed(2)}
              </span>
              {getStockBadge(p.stock || 0)}
            </div>
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 font-semibold h-10"
                onClick={() => openEdit(p)}
              >
                <Edit className="size-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 font-semibold h-10 text-rose-600 border-rose-100 hover:bg-rose-50"
                onClick={() => deleteProduct(p.id)}
                disabled={isDeleting === p.id}
              >
                {isDeleting === p.id ? (
                  <Spinner className="size-4" />
                ) : (
                  <Trash2 className="size-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {pagination.totalItems > 0 && (
        <Card className="lg:hidden sm:col-span-2">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(pagination.currentPage - 1)
              }
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of{" "}
              {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(pagination.currentPage + 1)
              }
              disabled={
                pagination.currentPage ===
                  pagination.totalPages ||
                pagination.totalPages === 0
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function CreateProductDialog({
  dialogState,
  dispatch,
  createProduct,
  handleImageUpload,
  categories,
}: {
  dialogState: ProductsDialogState;
  dispatch: React.Dispatch<ProductsDialogAction>;
  createProduct: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <Dialog open={dialogState.createOpen} onOpenChange={(v) => dispatch({ type: "SET_CREATE_OPEN", payload: v })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <ProductFormFields form={dialogState.form} setForm={(f: ProductsDialogState["form"]) => dispatch({ type: "SET_FORM", payload: f })} preview={dialogState.preview} setPreview={(p: string | null) => dispatch({ type: "SET_PREVIEW", payload: p })} categories={categories} prefix="create" onImageUpload={handleImageUpload} />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: false })}
            disabled={dialogState.isCreating}
          >
            Cancel
          </Button>
          <Button onClick={createProduct} disabled={dialogState.isCreating}>
            {dialogState.isCreating ? (
              <>
                <Spinner className="mr-2" /> Creating…
              </>
            ) : (
              "Create Product"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditProductDialog({
  dialogState,
  dispatch,
  saveEdit,
  handleImageUpload,
  categories,
  editingRef,
}: {
  dialogState: ProductsDialogState;
  dispatch: React.Dispatch<ProductsDialogAction>;
  saveEdit: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
  categories: Array<{ id: string; name: string }>;
  editingRef: React.MutableRefObject<Product | null>;
}) {
  return (
    <Dialog open={dialogState.editOpen} onOpenChange={(v) => dispatch({ type: "SET_EDIT_OPEN", payload: v })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <ProductFormFields form={dialogState.form} setForm={(f: ProductsDialogState["form"]) => dispatch({ type: "SET_FORM", payload: f })} preview={dialogState.preview} setPreview={(p: string | null) => dispatch({ type: "SET_PREVIEW", payload: p })} categories={categories} prefix="edit" onImageUpload={handleImageUpload} />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "SET_EDIT_OPEN", payload: false })}
            disabled={dialogState.isEditing}
          >
            Cancel
          </Button>
          <Button onClick={saveEdit} disabled={dialogState.isEditing}>
            {dialogState.isEditing ? (
              <>
                <Spinner className="mr-2" /> Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductsStats({ stats }: { stats: Stats }) {
  return (
    <>
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <StatCard
          icon={Package}
          title="Total Products"
          value={stats.totalProducts}
          color="bg-blue-500"
        />
        <StatCard
          icon={DollarSign}
          title="Total Inventory Value"
          value={`$${stats.totalValue.toFixed(2)}`}
          color="bg-green-500"
        />
        <StatCard
          icon={AlertTriangle}
          title="Low Stock Items"
          value={stats.lowStockCount}
          color="bg-yellow-500"
        />
      </div>

      <Accordion type="single" collapsible className="w-full md:hidden">
        <AccordionItem value="stats" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Package className="size-5 text-muted-foreground" />
              <span className="font-medium">
                Product Statistics
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-1 gap-4">
              <StatCard
                icon={Package}
                title="Total Products"
                value={stats.totalProducts}
                color="bg-blue-500"
              />
              <StatCard
                icon={DollarSign}
                title="Total Inventory Value"
                value={`$${stats.totalValue.toFixed(2)}`}
                color="bg-green-500"
              />
              <StatCard
                icon={AlertTriangle}
                title="Low Stock Items"
                value={stats.lowStockCount}
                color="bg-yellow-500"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}

function ProductsFilters({
  categories,
  isSuperAdmin,
  categoryFilter,
  tenantFilter,
  searchQuery,
  handleFilterChange,
  handleTenantFilterChange,
  handleSearch,
}: {
  categories: Array<{ id: string; name: string }>;
  isSuperAdmin: boolean;
  categoryFilter: string;
  tenantFilter: string;
  searchQuery: string;
  handleFilterChange: (filter: string) => void;
  handleTenantFilterChange: (tenant: string) => void;
  handleSearch: (term: string) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3">
          <Select
            value={categoryFilter}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Categories
              </SelectItem>
              {(Array.isArray(categories)
                ? categories
                : []
              ).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isSuperAdmin && (
            <div className="w-[180px]">
              <Select
                value={tenantFilter}
                onValueChange={handleTenantFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Tenants
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Search by product name or ID..."
              defaultValue={searchQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e.currentTarget.value);
                }
              }}
              className="max-w-md"
            />
            <Button
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder="Search by product name or ID..."]',
                ) as HTMLInputElement;
                handleSearch(input?.value || "");
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

export default function ProductsTableClient(props: Props) {
  return (
    <Suspense fallback={<div className="p-6" />}>
      <ProductsTableClientInner {...props} />
    </Suspense>
  );
}

function ProductsTableClientInner({
    products,
    stats,
    pagination,
    categories,
    isSuperAdmin = false,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { confirm, ConfirmDialog } = useConfirm();

    // Local state for UI interactions (Dialogs, Forms)
  const [dialogState, dispatch] = useReducer(productsDialogReducer, {
    createOpen: false,
    editOpen: false,
    form: { name: "", price: "", stock: "", category: "", imageBase64: "" },
    preview: null,
    isCreating: false,
    isEditing: false,
    isDeleting: null,
  });
  const editingRef = useRef<Product | null>(null);

    // URL State
    const searchQuery = searchParams.get("search") || "";
    const categoryFilter = searchParams.get("category") || "all";
    const tenantFilter = searchParams.get("tenantId") || "all";

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1 on search
        router.push(`?${params.toString()}`);
    };

    const handleFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams);
        if (newFilter && newFilter !== "all") {
            params.set("category", newFilter);
        } else {
            params.delete("category");
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        isEdit: boolean,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
    dispatch({ type: "SET_FORM", payload: { ...dialogState.form, imageBase64: base64 } });
    dispatch({ type: "SET_PREVIEW", payload: base64 });
        };
        reader.readAsDataURL(file);
    };

    const createProduct = async () => {
        if (!dialogState.form.name) {
            toast.error("Name is required");
            return;
        }
  if (Number(dialogState.form.price) < 0 || Number(dialogState.form.stock) < 0) {
    toast.error("Price and Stock cannot be negative");
    return;
  }

  dispatch({ type: "SET_IS_CREATING", payload: true });
  try {
    const body = {
      name: dialogState.form.name,
      description: "",
      price: Number(dialogState.form.price || 0),
      stock: Number(dialogState.form.stock || 0),
      categoryIds: dialogState.form.category ? [dialogState.form.category] : [],
      image: dialogState.form.imageBase64 || undefined,
                ownerId: "admin",
            };
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to create product");
                return;
            }
    toast.success("Product created");
    dispatch({ type: "SET_CREATE_OPEN", payload: false });
    dispatch({ type: "SET_FORM", payload: {
      name: "",
      price: "",
      stock: "",
      category: "",
      imageBase64: "",
    }});
    dispatch({ type: "SET_PREVIEW", payload: null });
    router.refresh();
  } catch {
    toast.error("Network error");
  } finally {
    dispatch({ type: "SET_IS_CREATING", payload: false });
        }
    };

    const deleteProduct = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Product",
            description:
                "Are you sure you want to delete this product? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!confirmed) return;
        dispatch({ type: "SET_IS_DELETING", payload: id });
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                toast.error("Failed to delete");
                return;
            }
            toast.success("Product deleted");
            router.refresh();
        } catch {
            toast.error("Network error");
        } finally {
            dispatch({ type: "SET_IS_DELETING", payload: null });
        }
    };

    const openEdit = (p: Product) => {
        editingRef.current = p;
  dispatch({ type: "SET_FORM", payload: {
    name: p.name,
    price: String(p.price),
    stock: String(p.stock || 0),
    category: p.categories?.[0]?.id || "",
    imageBase64: "",
  }});
  dispatch({ type: "SET_PREVIEW", payload: p.image || null });
  dispatch({ type: "SET_EDIT_OPEN", payload: true });
    };

    const saveEdit = async () => {
        if (!editingRef.current) return;
  if (Number(dialogState.form.price) < 0 || Number(dialogState.form.stock) < 0) {
    toast.error("Price and Stock cannot be negative");
    return;
  }

  dispatch({ type: "SET_IS_EDITING", payload: true });
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      name: dialogState.form.name,
      price: Number(dialogState.form.price || 0),
      stock: Number(dialogState.form.stock || 0),
      categoryIds: dialogState.form.category ? [dialogState.form.category] : [],
    };
    if (dialogState.form.imageBase64) body.image = dialogState.form.imageBase64;

            const res = await fetch(`/api/products/${editingRef.current.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to update");
                return;
            }
    toast.success("Product updated");
    dispatch({ type: "SET_EDIT_OPEN", payload: false });
    editingRef.current = null;
    dispatch({ type: "SET_FORM", payload: {
      name: "",
      price: "",
      stock: "",
      category: "",
      imageBase64: "",
    }});
    dispatch({ type: "SET_PREVIEW", payload: null });
    router.refresh();
  } catch {
    toast.error("Network error");
  } finally {
    dispatch({ type: "SET_IS_EDITING", payload: false });
        }
    };

  return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">Products Management</h2>
                <Button onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: true })}>
                    <Plus className="size-4 mr-2" />
                    Add Product
                </Button>
            </div>

      <ProductsStats stats={stats} />

      <ProductsFilters
        categories={categories}
        isSuperAdmin={isSuperAdmin}
        categoryFilter={categoryFilter}
        tenantFilter={tenantFilter}
        searchQuery={searchQuery}
        handleFilterChange={handleFilterChange}
        handleTenantFilterChange={handleTenantFilterChange}
        handleSearch={handleSearch}
      />

      <ProductsDesktopTable
        products={products}
        isSuperAdmin={isSuperAdmin}
        openEdit={openEdit}
        deleteProduct={deleteProduct}
        isDeleting={dialogState.isDeleting}
        pagination={pagination}
        handlePageChange={handlePageChange}
      />

      <ProductsMobileCards
        products={products}
        openEdit={openEdit}
        deleteProduct={deleteProduct}
        isDeleting={dialogState.isDeleting}
        pagination={pagination}
        handlePageChange={handlePageChange}
      />

      <CreateProductDialog
        dialogState={dialogState}
        dispatch={dispatch}
        createProduct={createProduct}
        handleImageUpload={handleImageUpload}
        categories={categories}
      />

      <EditProductDialog
        dialogState={dialogState}
        dispatch={dispatch}
        saveEdit={saveEdit}
        handleImageUpload={handleImageUpload}
        categories={categories}
        editingRef={editingRef}
      />

            <ConfirmDialog />
        </div>
    );
}
