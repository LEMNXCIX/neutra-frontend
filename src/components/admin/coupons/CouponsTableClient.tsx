"use client";

import React, { Suspense, useState, useRef, useReducer } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { couponsService } from "@/services/coupons.service";
import { ApiError } from "@/lib/api-client";
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
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
Edit,
Trash2,
Plus,
Ticket,
CheckCircle2,
XCircle,
Clock,
Zap,
ChevronLeft,
ChevronRight,
Percent,
DollarSign,
} from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { Coupon, CouponType, CreateCouponDTO, UpdateCouponDTO } from "@/types/coupon.types";
import { bookingService, Service } from "@/services/booking.service";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

type DialogState = {
createOpen: boolean;
editOpen: boolean;
viewOpen: boolean;
editing: Coupon | null;
viewing: Coupon | null;
isCreating: boolean;
isEditing: boolean;
isDeleting: string | null;
appliesToAll: boolean;
};

type DialogAction =
| { type: "SET_CREATE_OPEN"; payload: boolean }
| { type: "SET_EDIT_OPEN"; payload: boolean }
| { type: "SET_VIEW_OPEN"; payload: boolean }
| { type: "SET_EDITING"; payload: Coupon | null }
| { type: "SET_VIEWING"; payload: Coupon | null }
| { type: "SET_IS_CREATING"; payload: boolean }
| { type: "SET_IS_EDITING"; payload: boolean }
| { type: "SET_IS_DELETING"; payload: string | null }
| { type: "SET_APPLIES_TO_ALL"; payload: boolean };

const initialDialogState: DialogState = {
createOpen: false,
editOpen: false,
viewOpen: false,
editing: null,
viewing: null,
isCreating: false,
isEditing: false,
isDeleting: null,
appliesToAll: true,
};

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
switch (action.type) {
case "SET_CREATE_OPEN":
return { ...state, createOpen: action.payload };
case "SET_EDIT_OPEN":
return { ...state, editOpen: action.payload };
case "SET_VIEW_OPEN":
return { ...state, viewOpen: action.payload };
case "SET_EDITING":
return { ...state, editing: action.payload };
case "SET_VIEWING":
return { ...state, viewing: action.payload };
case "SET_IS_CREATING":
return { ...state, isCreating: action.payload };
case "SET_IS_EDITING":
return { ...state, isEditing: action.payload };
case "SET_IS_DELETING":
return { ...state, isDeleting: action.payload };
case "SET_APPLIES_TO_ALL":
return { ...state, appliesToAll: action.payload };
default:
return state;
}
}

type Stats = {
totalCoupons: number;
usedCoupons: number;
unusedCoupons: number;
expiredCoupons: number;
activeCoupons: number;
};

type PaginationProps = {
currentPage: number;
totalPages: number;
totalItems: number;
itemsPerPage: number;
};

type Props = {
coupons: Coupon[];
stats: Stats;
pagination: PaginationProps;
isSuperAdmin?: boolean;
};

type FormState = {
code: string;
type: CouponType;
value: string;
description: string;
minPurchaseAmount: string;
maxDiscountAmount: string;
usageLimit: string;
active: boolean;
expiresAt: string;
applicableServices: string[];
};

const emptyForm: FormState = {
code: "",
type: CouponType.FIXED,
value: "",
description: "",
minPurchaseAmount: "",
maxDiscountAmount: "",
usageLimit: "",
active: true,
expiresAt: "",
applicableServices: [],
};

function buildUpdatedParams(searchParams: URLSearchParams, updates: Record<string, string | null>): string {
const params = new URLSearchParams(searchParams);
for (const [key, value] of Object.entries(updates)) {
if (value === null) {
params.delete(key);
} else {
params.set(key, value);
}
}
params.set("page", "1");
return `?${params.toString()}`;
}

function isExpired(date?: Date | string) {
if (!date) return false;
try {
return new Date(date) < new Date();
} catch {
return false;
}
}

function formatDate(date?: Date | string) {
if (!date) return "—";
try {
return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString();
} catch {
return String(date);
}
}

function getCouponStatus(c: Coupon) {
const isFullyUsed = c.usageLimit ? c.usageCount >= c.usageLimit : false;

if (!c.active) return { label: "Inactive", variant: "secondary" as const, color: "text-gray-500" };
if (isFullyUsed) return { label: "Used/Limit Reached", variant: "secondary" as const, color: "text-muted-foreground" };
if (isExpired(c.expiresAt)) return { label: "Expired", variant: "destructive" as const, color: "text-red-500" };
return { label: "Active", variant: "default" as const, color: "text-green-500" };
}

function CouponsSearchParamsConsumer({ children }: { children: (params: URLSearchParams) => React.ReactNode }) {
const searchParams = useSearchParams();
return <>{children(searchParams)}</>;
}

function StatCard({ icon: Icon, title, value, color }: { icon: React.ElementType; title: string; value: string | number; color: string }) {
return (
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
}

function CouponsStatsSection({ stats }: { stats: Stats }) {
return (
<>
<div className="hidden md:grid md:grid-cols-5 gap-4">
<StatCard icon={Ticket} title="Total Coupons" value={stats.totalCoupons} color="bg-purple-500" />
<StatCard icon={Zap} title="Active" value={stats.activeCoupons} color="bg-green-500" />
<StatCard icon={CheckCircle2} title="Used" value={stats.usedCoupons} color="bg-blue-500" />
<StatCard icon={XCircle} title="Unused" value={stats.unusedCoupons} color="bg-gray-500" />
<StatCard icon={Clock} title="Expired" value={stats.expiredCoupons} color="bg-red-500" />
</div>

<Accordion type="single" collapsible className="w-full lg:hidden">
<AccordionItem value="stats" className="border rounded-lg">
<AccordionTrigger className="px-4 hover:no-underline">
<div className="flex items-center gap-3">
<Ticket className="size-5 text-muted-foreground" />
<span className="font-medium">Coupon Statistics</span>
</div>
</AccordionTrigger>
<AccordionContent className="px-4 pb-4 pt-2">
<div className="grid grid-cols-1 gap-4">
<StatCard icon={Ticket} title="Total Coupons" value={stats.totalCoupons} color="bg-purple-500" />
<StatCard icon={Zap} title="Active" value={stats.activeCoupons} color="bg-green-500" />
<StatCard icon={CheckCircle2} title="Used" value={stats.usedCoupons} color="bg-blue-500" />
<StatCard icon={XCircle} title="Unused" value={stats.unusedCoupons} color="bg-gray-500" />
<StatCard icon={Clock} title="Expired" value={stats.expiredCoupons} color="bg-red-500" />
</div>
</AccordionContent>
</AccordionItem>
</Accordion>
</>
);
}

function CouponsFilterBar({
typeFilter,
statusFilter,
searchQuery,
onTypeFilterChange,
onStatusFilterChange,
onSearch,
}: {
typeFilter: string;
statusFilter: string;
searchQuery: string;
onTypeFilterChange: (v: string) => void;
onStatusFilterChange: (v: string) => void;
onSearch: (term: string) => void;
}) {
return (
<Card>
<CardContent className="pt-6">
<div className="flex flex-wrap gap-3">
<Select value={typeFilter} onValueChange={onTypeFilterChange}>
<SelectTrigger className="w-[150px]">
<SelectValue placeholder="All Types" />
</SelectTrigger>
<SelectContent>
<SelectItem value="all">All Types</SelectItem>
<SelectItem value={CouponType.FIXED}>Amount</SelectItem>
<SelectItem value={CouponType.PERCENT}>Percent</SelectItem>
</SelectContent>
</Select>

<Select value={statusFilter} onValueChange={onStatusFilterChange}>
<SelectTrigger className="w-[150px]">
<SelectValue placeholder="All Status" />
</SelectTrigger>
<SelectContent>
<SelectItem value="all">All Status</SelectItem>
<SelectItem value="active">Active</SelectItem>
<SelectItem value="used">Used</SelectItem>
<SelectItem value="unused">Unused</SelectItem>
<SelectItem value="expired">Expired</SelectItem>
</SelectContent>
</Select>

<div className="flex gap-2 flex-1">
<Input
placeholder="Search by code..."
defaultValue={searchQuery}
onKeyDown={(e) => {
if (e.key === 'Enter') {
onSearch(e.currentTarget.value);
}
}}
className="max-w-md"
/>
<Button onClick={() => {
const input = document.querySelector('input[placeholder="Search by code..."]') as HTMLInputElement;
onSearch(input?.value || "");
}}>Search</Button>
</div>
</div>
</CardContent>
</Card>
);
}

function CouponsDesktopTable({
coupons,
isSuperAdmin,
isDeleting,
onView,
onEdit,
onDelete,
pagination,
onPageChange,
}: {
coupons: Coupon[];
isSuperAdmin: boolean;
isDeleting: string | null;
onView: (c: Coupon) => void;
onEdit: (c: Coupon) => void;
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
<TableHead className="w-[150px]">Code</TableHead>
<TableHead className="w-[120px]">Type</TableHead>
{isSuperAdmin && <TableHead className="w-[120px]">Tenant</TableHead>}
<TableHead className="w-[120px]">Value</TableHead>
<TableHead className="w-[120px]">Status</TableHead>
<TableHead className="w-[150px]">Expires</TableHead>
<TableHead className="w-[150px]">Actions</TableHead>
</TableRow>
</TableHeader>
<TableBody>
{coupons.length === 0 ? (
<TableRow>
<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
No coupons found
</TableCell>
</TableRow>
) : (
coupons.map((c) => {
const status = getCouponStatus(c);
return (
<TableRow key={c.id} className="hover:bg-muted/30">
<TableCell className="font-mono font-bold">{c.code}</TableCell>
<TableCell>
<div className="flex items-center gap-2">
{c.type === CouponType.PERCENT ? (
<Percent className="size-4 text-muted-foreground" />
) : (
<DollarSign className="size-4 text-muted-foreground" />
)}
<span className="capitalize">{c.type === CouponType.PERCENT ? 'Percent' : 'Fixed'}</span>
</div>
</TableCell>
{isSuperAdmin && (
<TableCell>
<Badge variant="outline" className="font-mono text-[10px] uppercase">
{c.tenantId}
</Badge>
</TableCell>
)}
<TableCell className="font-medium">
{c.type === CouponType.PERCENT ? `${c.value}%` : `$${c.value}`}
</TableCell>
<TableCell>
<Badge variant={status.variant}>{status.label}</Badge>
</TableCell>
<TableCell className="text-sm text-muted-foreground">
{formatDate(c.expiresAt)}
</TableCell>
<TableCell>
<div className="flex gap-1">
<Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-50" onClick={() => onView(c)} title="View Details">
<Ticket className="size-4" />
</Button>
<Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => onEdit(c)} title="Edit">
<Edit className="size-4" />
</Button>
<Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(c.id)} title="Delete" disabled={isDeleting === c.id}>
{isDeleting === c.id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
</Button>
</div>
</TableCell>
</TableRow>
);
})
)}
</TableBody>
</Table>
</div>

{pagination.totalItems > 0 && (
<div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
<div className="text-sm text-muted-foreground">
Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
</div>
<div className="flex gap-2">
<Button
variant="outline"
size="sm"
onClick={() => onPageChange(pagination.currentPage - 1)}
disabled={pagination.currentPage === 1}
>
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

function CouponsMobileCards({
coupons,
isDeleting,
onView,
onEdit,
onDelete,
pagination,
onPageChange,
}: {
coupons: Coupon[];
isDeleting: string | null;
onView: (c: Coupon) => void;
onEdit: (c: Coupon) => void;
onDelete: (id: string) => void;
pagination: PaginationProps;
onPageChange: (page: number) => void;
}) {
return (
<div className="space-y-3 lg:hidden">
{coupons.map((c) => {
const status = getCouponStatus(c);
return (
<Card key={c.id} className="shadow-sm border-muted/50">
<CardContent className="pt-4 space-y-3">
<div className="flex justify-between items-start">
<div className="flex-1">
<h3 className="font-mono font-bold text-lg">{c.code}</h3>
<div className="flex items-center gap-2 mt-1">
{c.type === CouponType.PERCENT ? (
<Percent className="size-4 text-muted-foreground" />
) : (
<DollarSign className="size-4 text-muted-foreground" />
)}
<span className="text-sm capitalize">{c.type === CouponType.PERCENT ? 'Percent' : 'Fixed'}</span>
<span className="font-medium">
{c.type === CouponType.PERCENT ? `${c.value}%` : `$${c.value}`}
</span>
</div>
</div>
<Badge variant={status.variant}>{status.label}</Badge>
</div>
<div className="text-sm text-muted-foreground">
Expires: {formatDate(c.expiresAt)}
</div>
<div className="flex gap-2">
<Button size="sm" variant="outline" className="flex-1" onClick={() => onView(c)}>
<Ticket className="size-4 mr-1" />
View
</Button>
<Button size="sm" className="flex-1" onClick={() => onEdit(c)}>
<Edit className="size-4 mr-1" />
Edit
</Button>
<Button size="sm" variant="destructive" onClick={() => onDelete(c.id)} disabled={isDeleting === c.id}>
{isDeleting === c.id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
</Button>
</div>
</CardContent>
</Card>
);
})}

{pagination.totalItems > 0 && (
<Card className="lg:hidden">
<div className="flex items-center justify-between px-4 py-3">
<Button
variant="outline"
size="sm"
onClick={() => onPageChange(pagination.currentPage - 1)}
disabled={pagination.currentPage === 1}
>
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

function CouponFormFields({ form, onFormChange }: {
form: FormState;
onFormChange: (f: FormState) => void;
}) {
return (
<div className="space-y-4">
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>Code *</Label>
<Input
value={form.code}
onChange={(e) => onFormChange({ ...form, code: e.target.value })}
placeholder="COUPON CODE"
className="uppercase"
/>
</div>
<div className="space-y-2">
<Label>Type</Label>
<Select
value={form.type}
onValueChange={(v) => onFormChange({ ...form, type: v as CouponType })}
>
<SelectTrigger>
<SelectValue placeholder="Select type" />
</SelectTrigger>
<SelectContent>
<SelectItem value={CouponType.FIXED}>Amount ($)</SelectItem>
<SelectItem value={CouponType.PERCENT}>Percent (%)</SelectItem>
</SelectContent>
</Select>
</div>
</div>

<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>Value *</Label>
<Input
type="number"
value={form.value}
onChange={(e) => onFormChange({ ...form, value: e.target.value })}
placeholder={form.type === CouponType.PERCENT ? "10" : "25"}
/>
</div>
<div className="space-y-2">
<Label>Expires (Optional)</Label>
<Input
type="datetime-local"
value={form.expiresAt}
onChange={(e) => onFormChange({ ...form, expiresAt: e.target.value })}
/>
</div>
</div>

<div className="space-y-2">
<Label>Description</Label>
<Input
value={form.description}
onChange={(e) => onFormChange({ ...form, description: e.target.value })}
placeholder="Optional description"
/>
</div>

<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>Min Purchase Amount</Label>
<Input
type="number"
value={form.minPurchaseAmount}
onChange={(e) => onFormChange({ ...form, minPurchaseAmount: e.target.value })}
placeholder="0"
/>
</div>
<div className="space-y-2">
<Label>Max Discount Amount</Label>
<Input
type="number"
value={form.maxDiscountAmount}
onChange={(e) => onFormChange({ ...form, maxDiscountAmount: e.target.value })}
placeholder="0"
disabled={form.type !== CouponType.PERCENT}
/>
</div>
</div>

<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>Usage Limit</Label>
<Input
type="number"
value={form.usageLimit}
onChange={(e) => onFormChange({ ...form, usageLimit: e.target.value })}
placeholder="Unlimited"
/>
</div>
<div className="flex items-center gap-2 pt-8">
<Switch
checked={form.active}
onCheckedChange={(checked) => onFormChange({ ...form, active: checked })}
/>
<Label>Active</Label>
</div>
</div>
</div>
);
}

function CreateCouponDialog({
open,
onOpenChange,
form,
onFormChange,
isCreating,
onCreate,
}: {
open: boolean;
onOpenChange: (open: boolean) => void;
form: FormState;
onFormChange: (f: FormState) => void;
isCreating: boolean;
onCreate: () => void;
}) {
return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="max-w-md">
<DialogHeader>
<DialogTitle>Add New Coupon</DialogTitle>
</DialogHeader>
<CouponFormFields form={form} onFormChange={onFormChange} />
<DialogFooter>
<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
<Button onClick={onCreate} disabled={isCreating}>
{isCreating ? <><Spinner className="mr-2" /> Creating…</> : "Create Coupon"}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}

function EditCouponDialog({
open,
onOpenChange,
form,
onFormChange,
isEditing,
onSave,
}: {
open: boolean;
onOpenChange: (open: boolean) => void;
form: FormState;
onFormChange: (f: FormState) => void;
isEditing: boolean;
onSave: () => void;
}) {
return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="max-w-md">
<DialogHeader>
<DialogTitle>Edit Coupon</DialogTitle>
</DialogHeader>
<CouponFormFields form={form} onFormChange={onFormChange} />
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

function ViewCouponDialog({
open,
onOpenChange,
coupon,
services,
}: {
open: boolean;
onOpenChange: (open: boolean) => void;
coupon: Coupon | null;
services: Service[];
}) {
return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="max-w-md">
<DialogHeader>
<DialogTitle>Coupon Details</DialogTitle>
</DialogHeader>
{coupon && (
<div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Code</span>
              <p className="font-mono font-bold text-lg">{coupon.code}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Status</span>
<div className="mt-1">
<Badge variant={getCouponStatus(coupon).variant}>{getCouponStatus(coupon).label}</Badge>
</div>
</div>
</div>

<div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Type</span>
              <p className="capitalize">{coupon.type === CouponType.PERCENT ? 'Percent' : 'Fixed Amount'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Value</span>
<p className="font-medium">
{coupon.type === CouponType.PERCENT ? `${coupon.value}%` : `$${coupon.value}`}
</p>
</div>
</div>

          <div>
              <span className="text-sm font-medium text-muted-foreground">Description</span>
<p className="text-sm">{coupon.description || "—"}</p>
</div>

<div className="grid grid-cols-2 gap-4">
<div>
              <span className="text-sm font-medium text-muted-foreground">Min Purchase</span>
<p>${coupon.minPurchaseAmount || 0}</p>
</div>
<div>
              <span className="text-sm font-medium text-muted-foreground">Max Discount</span>
<p>{coupon.maxDiscountAmount ? `$${coupon.maxDiscountAmount}` : "Unlimited"}</p>
</div>
</div>

<div className="grid grid-cols-2 gap-4">
<div>
              <span className="text-sm font-medium text-muted-foreground">Usage</span>
<p>{coupon.usageCount} / {coupon.usageLimit || "∞"}</p>
</div>
<div>
              <span className="text-sm font-medium text-muted-foreground">Expires</span>
<p>{formatDate(coupon.expiresAt)}</p>
</div>
</div>

<div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t">
<div>
<span className="block">Created</span>
{formatDate(coupon.createdAt)}
</div>
<div>
<span className="block">Updated</span>
{formatDate(coupon.updatedAt)}
</div>
</div>

<div className="pt-2 border-t">
            <span className="text-sm font-medium text-muted-foreground mb-1 block">Applicable Services</span>
{coupon.applicableServices && coupon.applicableServices.length > 0 ? (
<div className="flex flex-wrap gap-1">
{coupon.applicableServices.map(serviceId => {
const service = services.find(s => s.id === serviceId);
return (
<Badge key={serviceId} variant="outline" className="text-xs">
{service ? service.name : serviceId}
</Badge>
);
})}
</div>
) : (
<p className="text-sm">All Services</p>
)}
</div>
</div>
)}
<DialogFooter>
<Button onClick={() => onOpenChange(false)}>Close</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}

export default function CouponsTableClient({ coupons: initialCoupons, stats, pagination, isSuperAdmin = false }: Props) {
return (
<Suspense fallback={null}>
<CouponsSearchParamsConsumer>
{(searchParams) => <CouponsTableClientInner coupons={initialCoupons} stats={stats} pagination={pagination} isSuperAdmin={isSuperAdmin} searchParams={searchParams} />}
</CouponsSearchParamsConsumer>
</Suspense>
);
}

function CouponsTableClientInner({ coupons: initialCoupons, stats, pagination, isSuperAdmin = false, searchParams }: Props & { searchParams: URLSearchParams }) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  const tenantFilter = searchParams.get('tenantId') || 'all';

  const handleTenantFilterChange = (value: string) => {
    router.push(buildUpdatedParams(searchParams, { tenantId: value === 'all' ? null : value }));
  };

  const [dialogState, dispatch] = useReducer(dialogReducer, initialDialogState);
const { createOpen, editOpen, viewOpen, editing, viewing, isCreating, isEditing, isDeleting, appliesToAll } = dialogState;

const setCreateOpen = (v: boolean) => dispatch({ type: "SET_CREATE_OPEN", payload: v });
const setEditOpen = (v: boolean) => dispatch({ type: "SET_EDIT_OPEN", payload: v });
const setViewOpen = (v: boolean) => dispatch({ type: "SET_VIEW_OPEN", payload: v });
const setEditing = (c: Coupon | null) => dispatch({ type: "SET_EDITING", payload: c });
const setViewing = (c: Coupon | null) => dispatch({ type: "SET_VIEWING", payload: c });
const setIsCreating = (v: boolean) => dispatch({ type: "SET_IS_CREATING", payload: v });
const setIsEditing = (v: boolean) => dispatch({ type: "SET_IS_EDITING", payload: v });
const setIsDeleting = (id: string | null) => dispatch({ type: "SET_IS_DELETING", payload: id });
const setAppliesToAll = (v: boolean) => dispatch({ type: "SET_APPLIES_TO_ALL", payload: v });

  const [services, setServices] = useState<Service[]>([]);
  const loadingServicesRef = useRef(false);

  const [form, setForm] = useState<FormState>(emptyForm);

  const loadServices = async () => {
    try {
      loadingServicesRef.current = true;
      const data = await bookingService.getServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to load services", error);
      toast.error("Failed to load services");
    } finally {
      loadingServicesRef.current = false;
    }
  };

  const loadServicesIfNeeded = async () => {
    if (services.length === 0 && !loadingServicesRef.current) {
await loadServices();
}
};

const searchQuery = searchParams.get("search") || "";
const typeFilter = searchParams.get("type") || "all";
const statusFilter = searchParams.get("status") || "all";

  const handleSearch = (term: string) => {
    router.push(buildUpdatedParams(searchParams, { search: term || null }));
  };

  const handleTypeFilterChange = (newFilter: string) => {
    router.push(buildUpdatedParams(searchParams, { type: newFilter && newFilter !== "all" ? newFilter : null }));
  };

  const handleStatusFilterChange = (newFilter: string) => {
    router.push(buildUpdatedParams(searchParams, { status: newFilter && newFilter !== "all" ? newFilter : null }));
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setAppliesToAll(true);
  };

const createCoupon = async () => {
if (!form.code) {
toast.error("Code is required");
return;
}
setIsCreating(true);
try {
const body: CreateCouponDTO = {
code: form.code.trim().toUpperCase(),
type: form.type,
value: Number(form.value || 0),
description: form.description || undefined,
minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : undefined,
maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
active: form.active,
expiresAt: form.expiresAt ? new Date(form.expiresAt) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
applicableServices: appliesToAll ? [] : form.applicableServices,
};
await couponsService.create(body);
toast.success("Coupon created");
setCreateOpen(false);
resetForm();
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to create coupon";
toast.error(message);
} finally {
setIsCreating(false);
}
};

const deleteCoupon = async (id: string) => {
const confirmed = await confirm({
title: "Delete Coupon",
description: "Are you sure you want to delete this coupon? This action cannot be undone.",
confirmText: "Delete",
variant: "destructive",
});
if (!confirmed) return;
setIsDeleting(id);
try {
await couponsService.delete(id);
toast.success("Coupon deleted");
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to delete coupon";
toast.error(message);
} finally {
setIsDeleting(null);
}
};

const openEdit = (c: Coupon) => {
loadServicesIfNeeded();
setEditing(c);
let formattedDate = "";
if (c.expiresAt) {
try {
const date = new Date(c.expiresAt);
const offset = date.getTimezoneOffset() * 60000;
const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
formattedDate = localISOTime;
} catch (e) {
console.error("Error parsing date", e);
}
}

setForm({
code: c.code,
type: c.type,
value: String(c.value),
description: c.description || "",
minPurchaseAmount: c.minPurchaseAmount ? String(c.minPurchaseAmount) : "",
maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
usageLimit: c.usageLimit ? String(c.usageLimit) : "",
active: c.active,
expiresAt: formattedDate,
applicableServices: c.applicableServices || [],
});
setAppliesToAll(!c.applicableServices || c.applicableServices.length === 0);
setEditOpen(true);
};

const openView = (c: Coupon) => {
setViewing(c);
setViewOpen(true);
};

const saveEdit = async () => {
if (!editing) return;
setIsEditing(true);
try {
const body: UpdateCouponDTO = {
code: form.code.trim().toUpperCase(),
type: form.type,
value: Number(form.value || 0),
description: form.description || undefined,
minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : undefined,
maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
active: form.active,
expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
applicableServices: appliesToAll ? [] : form.applicableServices,
};
await couponsService.update(editing.id, body);
toast.success("Coupon updated");
setEditOpen(false);
setEditing(null);
resetForm();
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to update coupon";
toast.error(message);
} finally {
setIsEditing(false);
}
};

return (
<div className="w-full space-y-6">
<div className="flex justify-between items-center">
<h2 className="text-xl font-medium">Coupons Management</h2>
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
<Button onClick={() => {
resetForm();
loadServicesIfNeeded();
setCreateOpen(true);
}}>
<Plus className="size-4 mr-2" />
Add Coupon
</Button>
</div>
</div>

<CouponsStatsSection stats={stats} />

<CouponsFilterBar
typeFilter={typeFilter}
statusFilter={statusFilter}
searchQuery={searchQuery}
onTypeFilterChange={handleTypeFilterChange}
onStatusFilterChange={handleStatusFilterChange}
onSearch={handleSearch}
/>

        <CouponsDesktopTable
          coupons={initialCoupons}
          isSuperAdmin={isSuperAdmin}
          isDeleting={isDeleting}
          onView={openView}
          onEdit={openEdit}
          onDelete={deleteCoupon}
          pagination={pagination}
          onPageChange={handlePageChange}
        />

        <CouponsMobileCards
          coupons={initialCoupons}
isDeleting={isDeleting}
onView={openView}
onEdit={openEdit}
onDelete={deleteCoupon}
pagination={pagination}
onPageChange={handlePageChange}
/>

<CreateCouponDialog
open={createOpen}
onOpenChange={setCreateOpen}
form={form}
onFormChange={setForm}
isCreating={isCreating}
onCreate={createCoupon}
/>

<EditCouponDialog
open={editOpen}
onOpenChange={setEditOpen}
form={form}
onFormChange={setForm}
isEditing={isEditing}
onSave={saveEdit}
/>

<ViewCouponDialog
open={viewOpen}
onOpenChange={setViewOpen}
coupon={viewing}
services={services}
/>

<ConfirmDialog />
</div>
);
}
