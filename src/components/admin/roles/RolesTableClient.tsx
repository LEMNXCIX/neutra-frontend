"use client";

import React, { useReducer, useRef, useSyncExternalStore, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { rolesService } from "@/services/roles.service";
import { permissionsService } from "@/services/permissions.service";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
Shield,
Plus,
Edit,
Trash2,
Key,
ChevronLeft,
ChevronRight,
Search,
} from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";

import { Role } from "@/types/role.types";
import { Permission } from "@/types/permission.types";
import { Spinner } from "@/components/ui/spinner";

type Stats = {
totalRoles: number;
totalPermissions: number;
};

type Pagination = {
currentPage: number;
totalPages: number;
totalItems: number;
itemsPerPage: number;
};

const EMPTY_PERMISSIONS: Permission[] = [];

type Props = {
roles: Role[];
permissions: Permission[];
stats: Stats;
rolePagination: Pagination;
permissionPagination: Pagination;
allPermissions?: Permission[];
};

const refreshPermissions = async () => {
try {
const response = await fetch(
`${process.env.NEXT_PUBLIC_BASE_URL}/auth/validate`,
{
credentials: "include",
},
);
if (response.ok) {
await response.json();
}
} catch (err) {
console.error("Failed to refresh permissions:", err);
}
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

function RoleFormFields({
form,
setForm,
availablePermissions,
isSearchingPerms,
rolePermissionSearch,
onSearchChange,
togglePermission,
prefix,
}: {
form: { name: string; description: string; level: number; permissionIds: string[] };
setForm: (value: { name: string; description: string; level: number; permissionIds: string[] }) => void;
availablePermissions: Permission[];
isSearchingPerms: boolean;
rolePermissionSearch: string;
onSearchChange: (value: string) => void;
togglePermission: (id: string) => void;
prefix: string;
}) {
return (
<div className="space-y-4">
<div className="space-y-2">
<Label htmlFor={`${prefix}-name`}>Role Name*</Label>
<Input id={`${prefix}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., EDITOR" />
</div>
<div className="space-y-2">
<Label htmlFor={`${prefix}-description`}>Description</Label>
<Input id={`${prefix}-description`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Role description" />
</div>
<div className="space-y-2">
<Label htmlFor={`${prefix}-level`}>Level</Label>
<Input id={`${prefix}-level`} type="number" value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 1 })} min={1} />
</div>
<div className="space-y-2">
<Label>Permissions</Label>
<div className="relative">
<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
<Input placeholder="Search permissions..." className="pl-9 mb-2" value={rolePermissionSearch} onChange={(e) => onSearchChange(e.target.value)} />
</div>
<div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
{isSearchingPerms ? (
<div className="text-center py-4 text-sm text-muted-foreground">Searching…</div>
) : availablePermissions.length === 0 ? (
<div className="text-center py-4 text-sm text-muted-foreground">No permissions found</div>
) : (
availablePermissions.map((permission) => (
<div key={permission.id} className="flex items-center gap-2">
<Checkbox id={`${prefix}-${permission.id}`} checked={form.permissionIds.includes(permission.id)} onCheckedChange={() => togglePermission(permission.id)} />
<label htmlFor={`${prefix}-${permission.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
{permission.name}
{permission.description && (<span className="text-xs text-muted-foreground ml-2">({permission.description})</span>)}
</label>
</div>
))
)}
</div>
</div>
</div>
);
}

function PermissionFormFields({
permForm,
setPermForm,
prefix,
}: {
permForm: { name: string; description: string };
setPermForm: (form: { name: string; description: string }) => void;
prefix: string;
}) {
return (
<div className="space-y-4">
<div>
<Label htmlFor={`${prefix}-perm-name`}>Permission Name*</Label>
<Input id={`${prefix}-perm-name`} value={permForm.name} onChange={(e) => setPermForm({ ...permForm, name: e.target.value })} placeholder="e.g., users:read, products:write" />
</div>
<div>
<Label htmlFor={`${prefix}-perm-description`}>Description</Label>
<Input id={`${prefix}-perm-description`} value={permForm.description} onChange={(e) => setPermForm({ ...permForm, description: e.target.value })} placeholder="Permission description" />
</div>
</div>
);
}

type RolesDialogState = {
createOpen: boolean;
editOpen: boolean;
form: { name: string; description: string; level: number; permissionIds: string[] };
isCreatingRole: boolean;
isEditingRole: boolean;
isDeletingRole: string | null;
rolePermissionSearch: string;
availablePermissions: Permission[];
isSearchingPerms: boolean;
};

type RolesDialogAction =
| { type: "SET_CREATE_OPEN"; payload: boolean }
| { type: "SET_EDIT_OPEN"; payload: boolean }
| { type: "SET_FORM"; payload: RolesDialogState["form"] }
| { type: "SET_IS_CREATING_ROLE"; payload: boolean }
| { type: "SET_IS_EDITING_ROLE"; payload: boolean }
| { type: "SET_IS_DELETING_ROLE"; payload: string | null }
| { type: "SET_ROLE_PERMISSION_SEARCH"; payload: string }
| { type: "SET_AVAILABLE_PERMISSIONS"; payload: Permission[] }
| { type: "SET_IS_SEARCHING_PERMS"; payload: boolean };

type PermsDialogState = {
permCreateOpen: boolean;
permEditOpen: boolean;
permForm: { name: string; description: string };
isCreatingPerm: boolean;
isEditingPerm: boolean;
isDeletingPerm: string | null;
};

type PermsDialogAction =
| { type: "SET_PERM_CREATE_OPEN"; payload: boolean }
| { type: "SET_PERM_EDIT_OPEN"; payload: boolean }
| { type: "SET_PERM_FORM"; payload: PermsDialogState["permForm"] }
| { type: "SET_IS_CREATING_PERM"; payload: boolean }
| { type: "SET_IS_EDITING_PERM"; payload: boolean }
| { type: "SET_IS_DELETING_PERM"; payload: string | null };

function permsDialogReducer(state: PermsDialogState, action: PermsDialogAction): PermsDialogState {
switch (action.type) {
case "SET_PERM_CREATE_OPEN":
return { ...state, permCreateOpen: action.payload };
case "SET_PERM_EDIT_OPEN":
return { ...state, permEditOpen: action.payload };
case "SET_PERM_FORM":
return { ...state, permForm: action.payload };
case "SET_IS_CREATING_PERM":
return { ...state, isCreatingPerm: action.payload };
case "SET_IS_EDITING_PERM":
return { ...state, isEditingPerm: action.payload };
case "SET_IS_DELETING_PERM":
return { ...state, isDeletingPerm: action.payload };
default:
return state;
}
}

function rolesDialogReducer(state: RolesDialogState, action: RolesDialogAction): RolesDialogState {
switch (action.type) {
case "SET_CREATE_OPEN":
return { ...state, createOpen: action.payload };
case "SET_EDIT_OPEN":
return { ...state, editOpen: action.payload };
case "SET_FORM":
return { ...state, form: action.payload };
case "SET_IS_CREATING_ROLE":
return { ...state, isCreatingRole: action.payload };
case "SET_IS_EDITING_ROLE":
return { ...state, isEditingRole: action.payload };
case "SET_IS_DELETING_ROLE":
return { ...state, isDeletingRole: action.payload };
case "SET_ROLE_PERMISSION_SEARCH":
return { ...state, rolePermissionSearch: action.payload };
case "SET_AVAILABLE_PERMISSIONS":
return { ...state, availablePermissions: action.payload };
case "SET_IS_SEARCHING_PERMS":
return { ...state, isSearchingPerms: action.payload };
default:
return state;
}
}

const emptySubscribe = () => () => {};

function SearchBar({
placeholder,
searchKey,
onSearch,
searchParams,
}: {
placeholder: string;
searchKey: string;
onSearch: (term: string) => void;
searchParams: URLSearchParams;
}) {
return (
<div className="relative w-full sm:w-72">
<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
<Input
placeholder={placeholder}
className="pl-9"
onChange={(e) => onSearch(e.target.value)}
defaultValue={searchParams.get(searchKey)?.toString()}
/>
</div>
);
}

function RolesDesktopTable({
roles,
openEdit,
handleDelete,
isDeletingRole,
rolePagination,
searchParams,
router,
}: {
roles: Role[];
openEdit: (role: Role) => void;
handleDelete: (id: string) => void;
isDeletingRole: string | null;
rolePagination: Pagination;
searchParams: URLSearchParams;
router: ReturnType<typeof useRouter>;
}) {
return (
<Card className="hidden lg:block">
<div className="overflow-x-auto">
<Table>
<TableHeader>
<TableRow>
<TableHead className="w-[200px]">
Name
</TableHead>
<TableHead className="w-[300px]">
Description
</TableHead>
<TableHead className="w-[100px]">
Level
</TableHead>
<TableHead className="w-[150px]">
Permissions
</TableHead>
<TableHead className="w-[150px]">
Actions
</TableHead>
</TableRow>
</TableHeader>
<TableBody>
{roles.length === 0 ? (
<TableRow>
<TableCell
colSpan={5}
className="text-center py-8 text-muted-foreground"
>
No roles found
</TableCell>
</TableRow>
) : (
roles.map((role) => (
<TableRow
key={role.id}
className="group hover:bg-muted/50 transition-colors border-b border-border/50"
>
<TableCell className="py-4">
<div className="flex items-center gap-3">
<div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-sm">
<Shield size={14} />
</div>
<span className="font-semibold text-sm">
{role.name}
</span>
</div>
</TableCell>
<TableCell>
<span className="text-sm text-muted-foreground font-medium line-clamp-1 max-w-[300px]">
{role.description ||
"—"}
</span>
</TableCell>
<TableCell>
<Badge
variant="secondary"
className="text-[10px] font-bold uppercase tracking-wider"
>
Level {role.level || 0}
</Badge>
</TableCell>
<TableCell>
<Badge
variant="secondary"
className="bg-muted text-foreground font-bold text-[10px] rounded-full px-3 py-1"
>
{role.permissions
?.length || 0}{" "}
PERMISSIONS
</Badge>
</TableCell>
<TableCell className="text-right">
<div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
<Button
size="icon"
variant="ghost"
className="size-8 rounded-full hover:bg-primary/5 hover:text-primary"
onClick={() =>
openEdit(role)
}
>
<Edit className="size-4" />
</Button>
<Button
size="icon"
variant="ghost"
className="size-8 rounded-full hover:bg-destructive/5 hover:text-destructive"
onClick={() =>
handleDelete(
role.id,
)
}
disabled={
isDeletingRole ===
role.id
}
>
{isDeletingRole ===
role.id ? (
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

{rolePagination.totalItems > 0 && (
<div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
<div className="text-sm text-muted-foreground">
Showing{" "}
{(rolePagination.currentPage - 1) *
rolePagination.itemsPerPage +
1}{" "}
to{" "}
{Math.min(
rolePagination.currentPage *
rolePagination.itemsPerPage,
rolePagination.totalItems,
)}{" "}
of {rolePagination.totalItems} results
</div>
<div className="flex gap-2">
<Button
variant="outline"
size="sm"
onClick={() => {
const params = new URLSearchParams(
searchParams,
);
params.set(
"rolePage",
(
rolePagination.currentPage -
1
).toString(),
);
router.push(
`?${params.toString()}`,
);
}}
disabled={
rolePagination.currentPage === 1
}
>
<ChevronLeft className="size-4 mr-1" />
Previous
</Button>
<div className="hidden sm:flex items-center gap-1">
{Array.from(
{
length: Math.min(
5,
rolePagination.totalPages,
),
},
(_, i) => {
let pageNum;
if (
rolePagination.totalPages <=
5
) {
pageNum = i + 1;
} else if (
rolePagination.currentPage <=
3
) {
pageNum = i + 1;
} else if (
rolePagination.currentPage >=
rolePagination.totalPages -
2
) {
pageNum =
rolePagination.totalPages -
4 +
i;
} else {
pageNum =
rolePagination.currentPage -
2 +
i;
}
return (
<Button
key={pageNum}
variant={
rolePagination.currentPage ===
pageNum
? "default"
: "outline"
}
size="sm"
onClick={() => {
const params =
new URLSearchParams(
searchParams,
);
params.set(
"rolePage",
pageNum.toString(),
);
router.push(
`?${params.toString()}`,
);
}}
className="min-w-[2.5rem]"
>
{pageNum}
</Button>
);
},
)}
</div>
<div className="sm:hidden text-sm text-muted-foreground px-2">
Page {rolePagination.currentPage} of{" "}
{rolePagination.totalPages}
</div>
<Button
variant="outline"
size="sm"
onClick={() => {
const params = new URLSearchParams(
searchParams,
);
params.set(
"rolePage",
(
rolePagination.currentPage +
1
).toString(),
);
router.push(
`?${params.toString()}`,
);
}}
disabled={
rolePagination.currentPage ===
rolePagination.totalPages
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

function RolesMobileCards({
roles,
openEdit,
handleDelete,
isDeletingRole,
rolePagination,
searchParams,
router,
}: {
roles: Role[];
openEdit: (role: Role) => void;
handleDelete: (id: string) => void;
isDeletingRole: string | null;
rolePagination: Pagination;
searchParams: URLSearchParams;
router: ReturnType<typeof useRouter>;
}) {
return (
<div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
{roles.length === 0 ? (
<Card>
<CardContent className="py-8 text-center text-muted-foreground">
No roles found
</CardContent>
</Card>
) : (
roles.map((role) => (
<Card key={role.id} className="overflow-hidden">
<CardContent className="p-4 space-y-3">
<div className="flex items-start justify-between">
<div className="flex-1">
<h3 className="font-semibold text-lg">
{role.name}
</h3>
<p className="text-sm text-muted-foreground mt-1">
{role.description || "No description"}
</p>
</div>
<Badge
variant="outline"
className="ml-2"
>
Level {role.level || 0}
</Badge>
</div>

<div className="flex items-center gap-2">
<Shield className="size-4 text-muted-foreground" />
<Badge variant="secondary">
{role.permissions?.length || 0}{" "}
permissions
</Badge>
</div>

<div className="flex gap-2 pt-2 border-t">
<Button
size="sm"
variant="outline"
className="flex-1"
onClick={() => openEdit(role)}
>
<Edit className="size-4 mr-2" />
Edit
</Button>
<Button
size="sm"
variant="outline"
className="flex-1"
onClick={() =>
handleDelete(role.id)
}
disabled={
isDeletingRole === role.id
}
>
{isDeletingRole === role.id ? (
<Spinner className="size-4 mr-2" />
) : (
<Trash2 className="size-4 mr-2" />
)}
Delete
</Button>
</div>
</CardContent>
</Card>
))
)}

{rolePagination.totalItems > 0 && (
<Card className="col-span-full">
<div className="flex items-center justify-between px-4 py-3">
<Button
variant="outline"
size="sm"
onClick={() => {
const params = new URLSearchParams(
searchParams,
);
params.set(
"rolePage",
(
rolePagination.currentPage -
1
).toString(),
);
router.push(
`?${params.toString()}`,
);
}}
disabled={
rolePagination.currentPage === 1
}
>
<ChevronLeft className="size-4" />
</Button>
<span className="text-sm text-muted-foreground">
Page {rolePagination.currentPage} of{" "}
{rolePagination.totalPages}
</span>
<Button
variant="outline"
size="sm"
onClick={() => {
const params = new URLSearchParams(
searchParams,
);
params.set(
"rolePage",
(
rolePagination.currentPage +
1
).toString(),
);
router.push(
`?${params.toString()}`,
);
}}
disabled={
rolePagination.currentPage ===
rolePagination.totalPages
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

function PermissionsDesktopTable({
permissions,
openPermEdit,
handlePermDelete,
isDeletingPerm,
permissionPagination,
searchParams,
router,
}: {
permissions: Permission[];
openPermEdit: (permission: Permission) => void;
handlePermDelete: (id: string) => void;
isDeletingPerm: string | null;
permissionPagination: Pagination;
searchParams: URLSearchParams;
router: ReturnType<typeof useRouter>;
}) {
return (
<Card className="hidden lg:block">
<div className="overflow-x-auto">
<Table>
<TableHeader>
<TableRow>
<TableHead className="w-[250px]">
Name
</TableHead>
<TableHead className="w-[400px]">
Description
</TableHead>
<TableHead className="w-[150px]">
Actions
</TableHead>
</TableRow>
</TableHeader>
<TableBody>
{permissions.length === 0 ? (
<TableRow>
<TableCell
colSpan={3}
className="text-center py-8 text-muted-foreground"
>
No permissions found
</TableCell>
</TableRow>
) : (
permissions.map((permission) => (
<TableRow
key={permission.id}
className="hover:bg-muted/30"
>
<TableCell className="font-medium">
{permission.name}
</TableCell>
<TableCell className="text-sm text-muted-foreground">
{permission.description ||
"-"}
</TableCell>
<TableCell>
<div className="flex gap-2">
<Button
size="sm"
variant="ghost"
onClick={() =>
openPermEdit(
permission,
)
}
>
<Edit className="size-4" />
</Button>
<Button
size="sm"
variant="ghost"
onClick={() =>
handlePermDelete(
permission.id,
)
}
disabled={
isDeletingPerm ===
permission.id
}
>
{isDeletingPerm ===
permission.id ? (
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

{permissionPagination.totalItems > 0 && (
<div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
<div className="text-sm text-muted-foreground">
Showing{" "}
{(permissionPagination.currentPage - 1) *
permissionPagination.itemsPerPage +
1}{" "}
to{" "}
{Math.min(
permissionPagination.currentPage *
permissionPagination.itemsPerPage,
permissionPagination.totalItems,
)}{" "}
of {permissionPagination.totalItems} results
</div>
<div className="flex gap-2">
<Button
variant="outline"
size="sm"
onClick={() => {
const params = new URLSearchParams(
searchParams,
);
params.set(
"permissionPage",
(
permissionPagination.currentPage -
1
).toString(),
);
router.push(
`?${params.toString()}`,
);
}}
disabled={
permissionPagination.currentPage === 1
}
>
<ChevronLeft className="size-4 mr-1" />
Previous
</Button>
<div className="hidden sm:flex items-center gap-1">
{Array.from(
{
length: Math.min(
5,
permissionPagination.totalPages,
),
},
(_, i) => {
let pageNum;
if (
permissionPagination.totalPages <=
5
) {
pageNum = i + 1;
} else if (
permissionPagination.currentPage <=
3
) {
pageNum = i + 1;
} else if (
permissionPagination.currentPage >=
permissionPagination.totalPages -
2
) {
pageNum =
permissionPagination.totalPages -
4 +
i;
} else {
pageNum =
permissionPagination.currentPage -
2 +
i;
}
return (
<Button
key={pageNum}
variant={
permissionPagination.currentPage ===
pageNum
? "default"
: "outline"
}
size="sm"
onClick={() => {
const params =
new URLSearchParams(
searchParams,
);
params.set(
"permissionPage",
pageNum.toString(),
);
router.push(
`?${params.toString()}`,
);
}}
className="min-w-[2.5rem]"
>
{pageNum}
</Button>
);
},
)}
</div>
<div className="sm:hidden text-sm text-muted-foreground px-2">
Page {permissionPagination.currentPage}{" "}
of {permissionPagination.totalPages}
</div>
<Button
variant="outline"
size="sm"
onClick={() => {
const params = new URLSearchParams(
searchParams,
);
params.set(
"permissionPage",
(
permissionPagination.currentPage +
1
).toString(),
);
router.push(
`?${params.toString()}`,
);
}}
disabled={
permissionPagination.currentPage ===
permissionPagination.totalPages
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

function PermissionsMobileCards({
permissions,
openPermEdit,
handlePermDelete,
isDeletingPerm,
permissionPagination,
searchParams,
router,
}: {
permissions: Permission[];
openPermEdit: (permission: Permission) => void;
handlePermDelete: (id: string) => void;
isDeletingPerm: string | null;
permissionPagination: Pagination;
searchParams: URLSearchParams;
router: ReturnType<typeof useRouter>;
}) {
return (
<div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
{permissions.length === 0 ? (
<Card>
<CardContent className="py-8 text-center text-muted-foreground">
No permissions found
</CardContent>
</Card>
) : (
permissions.map((permission) => (
<Card
key={permission.id}
className="overflow-hidden"
>
<CardContent className="p-4 space-y-3">
<div>
<div className="flex items-center gap-2 mb-1">
<Key className="size-4 text-muted-foreground" />
<h3 className="font-semibold text-lg">
{permission.name}
</h3>
</div>
<p className="text-sm text-muted-foreground">
{permission.description || "No description"}
</p>
</div>

<div className="flex gap-2 pt-2 border-t">
<Button
size="sm"
variant="outline"
className="flex-1"
onClick={() => openPermEdit(permission)}
>
<Edit className="size-4 mr-2" />
Edit
</Button>
<Button
size="sm"
variant="outline"
className="flex-1"
onClick={() =>
handlePermDelete(
permission.id,
)
}
disabled={
isDeletingPerm === permission.id
}
>
{isDeletingPerm === permission.id ? (
<Spinner className="size-4 mr-2" />
) : (
<Trash2 className="size-4 mr-2" />
)}
Delete
</Button>
</div>
</CardContent>
</Card>
))
)}

{permissionPagination.totalItems > 0 && (
<Card className="col-span-full">
<div className="flex items-center justify-between px-4 py-3">
<Button
variant="outline"
size="sm"
onClick={() => {
const params = new URLSearchParams(
searchParams,
);
params.set(
"permissionPage",
(
permissionPagination.currentPage -
1
).toString(),
);
router.push(
`?${params.toString()}`,
);
}}
disabled={
permissionPagination.currentPage === 1
}
>
<ChevronLeft className="size-4" />
</Button>
<span className="text-sm text-muted-foreground">
Page {permissionPagination.currentPage}{" "}
of {permissionPagination.totalPages}
</span>
<Button
variant="outline"
size="sm"
onClick={() => {
const params = new URLSearchParams(
searchParams,
);
params.set(
"permissionPage",
(
permissionPagination.currentPage +
1
).toString(),
);
router.push(
`?${params.toString()}`,
);
}}
disabled={
permissionPagination.currentPage ===
permissionPagination.totalPages
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

function CreateRoleDialog({
dialogState,
dispatch,
onSearchChange,
togglePermission,
handleCreate,
}: {
dialogState: RolesDialogState;
dispatch: React.Dispatch<RolesDialogAction>;
onSearchChange: (value: string) => void;
togglePermission: (id: string) => void;
handleCreate: () => void;
}) {
return (
<Dialog open={dialogState.createOpen} onOpenChange={(v) => dispatch({ type: "SET_CREATE_OPEN", payload: v })}>
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
<DialogHeader>
<DialogTitle>Create New Role</DialogTitle>
</DialogHeader>
<RoleFormFields
form={dialogState.form}
setForm={(f) => dispatch({ type: "SET_FORM", payload: f })}
availablePermissions={dialogState.availablePermissions}
isSearchingPerms={dialogState.isSearchingPerms}
rolePermissionSearch={dialogState.rolePermissionSearch}
onSearchChange={onSearchChange}
togglePermission={togglePermission}
prefix="create"
/>
<DialogFooter>
<Button
variant="outline"
onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: false })}
>
Cancel
</Button>
<Button
onClick={handleCreate}
disabled={dialogState.isCreatingRole}
>
{dialogState.isCreatingRole ? (
<>
<Spinner className="mr-2" /> Creating…
</>
) : (
"Create Role"
)}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}

function EditRoleDialog({
dialogState,
dispatch,
onSearchChange,
togglePermission,
handleUpdate,
}: {
dialogState: RolesDialogState;
dispatch: React.Dispatch<RolesDialogAction>;
onSearchChange: (value: string) => void;
togglePermission: (id: string) => void;
handleUpdate: () => void;
}) {
return (
<Dialog open={dialogState.editOpen} onOpenChange={(v) => dispatch({ type: "SET_EDIT_OPEN", payload: v })}>
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
<DialogHeader>
<DialogTitle>Edit Role</DialogTitle>
</DialogHeader>
<RoleFormFields
form={dialogState.form}
setForm={(f) => dispatch({ type: "SET_FORM", payload: f })}
availablePermissions={dialogState.availablePermissions}
isSearchingPerms={dialogState.isSearchingPerms}
rolePermissionSearch={dialogState.rolePermissionSearch}
onSearchChange={onSearchChange}
togglePermission={togglePermission}
prefix="edit"
/>
<DialogFooter>
<Button
variant="outline"
onClick={() => dispatch({ type: "SET_EDIT_OPEN", payload: false })}
>
Cancel
</Button>
<Button onClick={handleUpdate} disabled={dialogState.isEditingRole}>
{dialogState.isEditingRole ? (
<>
<Spinner className="mr-2" /> Updating…
</>
) : (
"Update Role"
)}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}

function CreatePermissionDialog({
permState,
permDispatch,
handlePermCreate,
}: {
permState: PermsDialogState;
permDispatch: React.Dispatch<PermsDialogAction>;
handlePermCreate: () => void;
}) {
return (
<Dialog open={permState.permCreateOpen} onOpenChange={(v) => permDispatch({ type: "SET_PERM_CREATE_OPEN", payload: v })}>
<DialogContent className="sm:max-w-md">
<DialogHeader>
<DialogTitle>Create New Permission</DialogTitle>
</DialogHeader>
<PermissionFormFields permForm={permState.permForm} setPermForm={(f) => permDispatch({ type: "SET_PERM_FORM", payload: f })} prefix="create" />
<DialogFooter>
<Button
variant="outline"
onClick={() => permDispatch({ type: "SET_PERM_CREATE_OPEN", payload: false })}
>
Cancel
</Button>
<Button
onClick={handlePermCreate}
disabled={permState.isCreatingPerm}
>
{permState.isCreatingPerm ? (
<>
<Spinner className="mr-2" /> Creating…
</>
) : (
"Create Permission"
)}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}

function EditPermissionDialog({
permState,
permDispatch,
handlePermUpdate,
}: {
permState: PermsDialogState;
permDispatch: React.Dispatch<PermsDialogAction>;
handlePermUpdate: () => void;
}) {
return (
<Dialog open={permState.permEditOpen} onOpenChange={(v) => permDispatch({ type: "SET_PERM_EDIT_OPEN", payload: v })}>
<DialogContent className="sm:max-w-md">
<DialogHeader>
<DialogTitle>Edit Permission</DialogTitle>
</DialogHeader>
<PermissionFormFields permForm={permState.permForm} setPermForm={(f) => permDispatch({ type: "SET_PERM_FORM", payload: f })} prefix="edit" />
<DialogFooter>
<Button
variant="outline"
onClick={() => permDispatch({ type: "SET_PERM_EDIT_OPEN", payload: false })}
>
Cancel
</Button>
<Button
onClick={handlePermUpdate}
disabled={permState.isEditingPerm}
>
{permState.isEditingPerm ? (
<>
<Spinner className="mr-2" /> Updating…
</>
) : (
"Update Permission"
)}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}

function RolesTableClientInner({
  roles,
  permissions,
  allPermissions = EMPTY_PERMISSIONS,
  stats,
  rolePagination,
  permissionPagination,
}: Props) {
const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
const router = useRouter();
const searchParams = useSearchParams();
const pathname = usePathname();
const { confirm, ConfirmDialog } = useConfirm();

const handleSearch = useDebouncedCallback((term: string, type: "role" | "permission") => {
const params = new URLSearchParams(searchParams);
const pageKey = type === "role" ? "rolePage" : "permissionPage";
const searchKey = type === "role" ? "roleSearch" : "permissionSearch";
if (term) { params.set(searchKey, term); } else { params.delete(searchKey); }
params.set(pageKey, "1");
router.replace(`${pathname}?${params.toString()}`);
}, 300);

const [dialogState, dispatch] = useReducer(rolesDialogReducer, {
createOpen: false, editOpen: false,
form: { name: "", description: "", level: 1, permissionIds: [] as string[] },
isCreatingRole: false, isEditingRole: false, isDeletingRole: null,
rolePermissionSearch: "",
availablePermissions: allPermissions.length > 0 ? allPermissions : permissions,
isSearchingPerms: false,
});
const editingRef = useRef<Role | null>(null);

const handleDialogPermissionSearch = useDebouncedCallback(async (term: string) => {
dispatch({ type: "SET_IS_SEARCHING_PERMS", payload: true });
try {
if (!term && allPermissions.length > 0) {
dispatch({ type: "SET_AVAILABLE_PERMISSIONS", payload: allPermissions });
return;
}
const results = await permissionsService.getAll(term);
dispatch({ type: "SET_AVAILABLE_PERMISSIONS", payload: results });
} catch (error) {
console.error("Failed to search permissions:", error);
toast.error("Failed to search permissions");
} finally {
dispatch({ type: "SET_IS_SEARCHING_PERMS", payload: false });
}
}, 300);

const onSearchChange = (value: string) => {
dispatch({ type: "SET_ROLE_PERMISSION_SEARCH", payload: value });
handleDialogPermissionSearch(value);
};

const [permState, permDispatch] = useReducer(permsDialogReducer, {
permCreateOpen: false, permEditOpen: false,
permForm: { name: "", description: "" },
isCreatingPerm: false, isEditingPerm: false, isDeletingPerm: null,
});
const permEditingRef = useRef<Permission | null>(null);

const openCreate = () => {
dispatch({ type: "SET_FORM", payload: { name: "", description: "", level: 1, permissionIds: [] } });
dispatch({ type: "SET_ROLE_PERMISSION_SEARCH", payload: "" });
if (allPermissions.length > 0) { dispatch({ type: "SET_AVAILABLE_PERMISSIONS", payload: allPermissions }); }
dispatch({ type: "SET_CREATE_OPEN", payload: true });
};

const openEdit = (role: Role) => {
editingRef.current = role;
dispatch({ type: "SET_FORM", payload: { name: role.name, description: role.description || "", level: role.level || 1, permissionIds: role.permissions?.map((p: any) => p.id) || [] } });
dispatch({ type: "SET_ROLE_PERMISSION_SEARCH", payload: "" });
if (allPermissions.length > 0) { dispatch({ type: "SET_AVAILABLE_PERMISSIONS", payload: allPermissions }); }
dispatch({ type: "SET_EDIT_OPEN", payload: true });
};

const handleCreate = async () => {
if (!dialogState.form.name) { toast.error("Role name is required"); return; }
dispatch({ type: "SET_IS_CREATING_ROLE", payload: true });
try {
await rolesService.create(dialogState.form);
toast.success("Role created successfully");
dispatch({ type: "SET_CREATE_OPEN", payload: false });
await refreshPermissions();
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to create role";
toast.error(message);
} finally {
dispatch({ type: "SET_IS_CREATING_ROLE", payload: false });
}
};

const handleUpdate = async () => {
if (!editingRef.current) return;
dispatch({ type: "SET_IS_EDITING_ROLE", payload: true });
try {
await rolesService.update(editingRef.current.id, dialogState.form);
toast.success("Role updated successfully");
dispatch({ type: "SET_EDIT_OPEN", payload: false });
await refreshPermissions();
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to update role";
toast.error(message);
} finally {
dispatch({ type: "SET_IS_EDITING_ROLE", payload: false });
}
};

const handleDelete = async (id: string) => {
const confirmed = await confirm({ title: "Delete Role", description: "Are you sure you want to delete this role?", confirmText: "Delete", variant: "destructive" });
if (!confirmed) return;
if (!confirmed) return;
dispatch({ type: "SET_IS_DELETING_ROLE", payload: id });
try {
await rolesService.delete(id);
toast.success("Role deleted successfully");
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to delete role";
toast.error(message);
} finally {
dispatch({ type: "SET_IS_DELETING_ROLE", payload: null });
}
};

const togglePermission = (permissionId: string) => {
dispatch({ type: "SET_FORM", payload: { ...dialogState.form, permissionIds: dialogState.form.permissionIds.includes(permissionId) ? dialogState.form.permissionIds.filter((id) => id !== permissionId) : [...dialogState.form.permissionIds, permissionId] } });
};

const openPermCreate = () => {
permDispatch({ type: "SET_PERM_FORM", payload: { name: "", description: "" } });
permDispatch({ type: "SET_PERM_CREATE_OPEN", payload: true });
};

const openPermEdit = (permission: Permission) => {
permEditingRef.current = permission;
permDispatch({ type: "SET_PERM_FORM", payload: { name: permission.name, description: permission.description || "" } });
permDispatch({ type: "SET_PERM_EDIT_OPEN", payload: true });
};

const handlePermCreate = async () => {
if (!permState.permForm.name) { toast.error("Permission name is required"); return; }
permDispatch({ type: "SET_IS_CREATING_PERM", payload: true });
try {
await permissionsService.create(permState.permForm);
toast.success("Permission created successfully");
permDispatch({ type: "SET_PERM_CREATE_OPEN", payload: false });
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to create permission";
toast.error(message);
} finally {
permDispatch({ type: "SET_IS_CREATING_PERM", payload: false });
}
};

const handlePermUpdate = async () => {
if (!permEditingRef.current) return;
permDispatch({ type: "SET_IS_EDITING_PERM", payload: true });
try {
await permissionsService.update(permEditingRef.current.id, permState.permForm);
toast.success("Permission updated successfully");
permDispatch({ type: "SET_PERM_EDIT_OPEN", payload: false });
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to update permission";
toast.error(message);
} finally {
permDispatch({ type: "SET_IS_EDITING_PERM", payload: false });
}
};

const handlePermDelete = async (id: string) => {
const confirmed = await confirm({ title: "Delete Permission", description: "Are you sure you want to delete this permission?", confirmText: "Delete", variant: "destructive" });
if (!confirmed) return;
permDispatch({ type: "SET_IS_DELETING_PERM", payload: id });
try {
await permissionsService.delete(id);
toast.success("Permission deleted successfully");
await refreshPermissions();
router.refresh();
} catch (err) {
const message = err instanceof ApiError ? err.message : "Failed to delete permission";
toast.error(message);
} finally {
permDispatch({ type: "SET_IS_DELETING_PERM", payload: null });
}
};

if (!isMounted) return null;

const roleProps = { roles, openEdit, handleDelete, isDeletingRole: dialogState.isDeletingRole, rolePagination, searchParams, router };
const permProps = { permissions, openPermEdit, handlePermDelete, isDeletingPerm: permState.isDeletingPerm, permissionPagination, searchParams, router };

return (
<div className="w-full space-y-6" suppressHydrationWarning>
<div className="flex justify-between items-center">
<h2 className="text-xl font-medium">Roles & Permissions Management</h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<StatCard icon={Shield} title="Total Roles" value={stats.totalRoles} color="bg-purple-500" />
<StatCard icon={Key} title="Total Permissions" value={stats.totalPermissions} color="bg-blue-500" />
</div>
<Tabs defaultValue="roles" className="w-full">
<TabsList className="grid w-full max-w-md grid-cols-2">
<TabsTrigger value="roles">Roles</TabsTrigger>
<TabsTrigger value="permissions">Permissions</TabsTrigger>
</TabsList>
<TabsContent value="roles" className="space-y-4">
<div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
<SearchBar placeholder="Search roles..." searchKey="roleSearch" onSearch={(term) => handleSearch(term, "role")} searchParams={searchParams} />
<Button onClick={openCreate}><Plus className="size-4 mr-2" />Create Role</Button>
</div>
<RolesDesktopTable {...roleProps} />
<RolesMobileCards {...roleProps} />
</TabsContent>
<TabsContent value="permissions" className="space-y-4">
<div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
<SearchBar placeholder="Search permissions..." searchKey="permissionSearch" onSearch={(term) => handleSearch(term, "permission")} searchParams={searchParams} />
<Button onClick={openPermCreate}><Plus className="size-4 mr-2" />Create Permission</Button>
</div>
<PermissionsDesktopTable {...permProps} />
<PermissionsMobileCards {...permProps} />
</TabsContent>
</Tabs>
<CreateRoleDialog dialogState={dialogState} dispatch={dispatch} onSearchChange={onSearchChange} togglePermission={togglePermission} handleCreate={handleCreate} />
<EditRoleDialog dialogState={dialogState} dispatch={dispatch} onSearchChange={onSearchChange} togglePermission={togglePermission} handleUpdate={handleUpdate} />
<CreatePermissionDialog permState={permState} permDispatch={permDispatch} handlePermCreate={handlePermCreate} />
<EditPermissionDialog permState={permState} permDispatch={permDispatch} handlePermUpdate={handlePermUpdate} />
      <ConfirmDialog />
      </div>
    );
  }

export default function RolesTableClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <RolesTableClientInner {...props} />
    </Suspense>
  );
}
