"use client";

import React, { Suspense, useRef, useReducer, useCallback, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { usersService } from "@/services/users.service";
import { tenantService } from "@/services/tenant.service";
import { Tenant } from "@/types/tenant";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AssignRoleDialog } from "./AssignRoleDialog";

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
import { Spinner } from "@/components/ui/spinner";
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from "@/components/ui/accordion";
import {
Edit,
UserCircle,
Shield,
Users,
ChevronLeft,
ChevronRight,
UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types/user.types";
import { cn } from "@/lib/utils";

const isUserAdmin = (u: User) =>
u.role?.name === "SUPER_ADMIN" || u.role?.name === "ADMIN";

const getRoleColor = (roleName?: string) => {
if (!roleName) return "bg-gray-500";

switch (roleName.toUpperCase()) {
case "SUPER_ADMIN":
return "bg-pink-600";
case "ADMIN":
return "bg-purple-500";
case "MANAGER":
return "bg-blue-500";
case "MODERATOR":
return "bg-green-500";
case "USER":
return "bg-gray-500";
default:
return "bg-slate-500";
}
};

type Stats = {
totalUsers: number;
adminUsers: number;
regularUsers: number;
};

type PaginationProps = {
currentPage: number;
totalPages: number;
totalItems: number;
itemsPerPage: number;
};

type Props = {
users: User[];
stats: Stats;
pagination: PaginationProps;
showTenant?: boolean;
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

type UsersDialogState = {
editOpen: boolean;
form: { name: string; email: string; tenantId: string };
roleDialogOpen: boolean;
selectedUser: User | null;
isSaving: boolean;
tenants: Tenant[];
isLoadingTenants: boolean;
};

type UsersDialogAction =
| { type: "SET_EDIT_OPEN"; payload: boolean }
| { type: "SET_FORM"; payload: UsersDialogState["form"] }
| { type: "SET_ROLE_DIALOG_OPEN"; payload: boolean }
| { type: "SET_SELECTED_USER"; payload: User | null }
| { type: "SET_IS_SAVING"; payload: boolean }
| { type: "SET_TENANTS"; payload: Tenant[] }
| { type: "SET_IS_LOADING_TENANTS"; payload: boolean };

function usersDialogReducer(state: UsersDialogState, action: UsersDialogAction): UsersDialogState {
switch (action.type) {
case "SET_EDIT_OPEN":
return { ...state, editOpen: action.payload };
case "SET_FORM":
return { ...state, form: action.payload };
case "SET_ROLE_DIALOG_OPEN":
return { ...state, roleDialogOpen: action.payload };
case "SET_SELECTED_USER":
return { ...state, selectedUser: action.payload };
case "SET_IS_SAVING":
return { ...state, isSaving: action.payload };
case "SET_TENANTS":
return { ...state, tenants: action.payload };
case "SET_IS_LOADING_TENANTS":
return { ...state, isLoadingTenants: action.payload };
default:
return state;
}
}

function EditUserDialog({
open,
onOpenChange,
form,
setForm,
showTenant,
tenants,
isLoadingTenants,
isSaving,
onSave,
}: {
open: boolean;
onOpenChange: (open: boolean) => void;
form: { name: string; email: string; tenantId: string };
setForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; tenantId: string }>>;
showTenant: boolean;
tenants: Tenant[];
isLoadingTenants: boolean;
isSaving: boolean;
onSave: () => void;
}) {
return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="max-w-md">
<DialogHeader>
<DialogTitle>Edit User</DialogTitle>
</DialogHeader>
<div className="space-y-4">
<div>
<label htmlFor="edit-user-name" className="text-sm font-medium">Name</label>
<Input id="edit-user-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="User name" />
</div>
<div>
<label htmlFor="edit-user-email" className="text-sm font-medium">Email</label>
<Input id="edit-user-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
</div>
{showTenant && (
<div>
<label htmlFor="edit-user-tenant" className="text-sm font-medium">Tenant</label>
<Select value={form.tenantId} onValueChange={(val) => setForm({ ...form, tenantId: val })} disabled={isLoadingTenants}>
<SelectTrigger id="edit-user-tenant"><SelectValue placeholder="Select Tenant" /></SelectTrigger>
<SelectContent>
{tenants.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
</SelectContent>
</Select>
</div>
)}
</div>
<DialogFooter>
<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
<Button onClick={onSave} disabled={isSaving}>
{isSaving ? (<><Spinner className="mr-2" /> Saving…</>) : "Save Changes"}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}

const emptySubscribe = () => () => {};

function UsersDesktopStats({ stats }: { stats: Stats }) {
return (
<div className="hidden lg:grid lg:grid-cols-3 gap-4">
<StatCard
icon={Users}
title="Total Users"
value={stats.totalUsers}
color="bg-blue-500"
/>
<StatCard
icon={Shield}
title="Administrators"
value={stats.adminUsers}
color="bg-purple-500"
/>
<StatCard
icon={UserCircle}
title="Regular Users"
value={stats.regularUsers}
color="bg-gray-500"
/>
</div>
);
}

function UsersMobileStats({ stats }: { stats: Stats }) {
return (
<Accordion type="single" collapsible className="w-full lg:hidden">
<AccordionItem value="stats" className="border rounded-lg">
<AccordionTrigger className="px-4 hover:no-underline">
<div className="flex items-center gap-3">
<Users className="size-5 text-muted-foreground" />
<span className="font-medium">User Statistics</span>
</div>
</AccordionTrigger>
<AccordionContent className="px-4 pb-4 pt-2">
<div className="grid grid-cols-1 gap-4">
<StatCard
icon={Users}
title="Total Users"
value={stats.totalUsers}
color="bg-blue-500"
/>
<StatCard
icon={Shield}
title="Administrators"
value={stats.adminUsers}
color="bg-purple-500"
/>
<StatCard
icon={UserCircle}
title="Regular Users"
value={stats.regularUsers}
color="bg-gray-500"
/>
</div>
</AccordionContent>
</AccordionItem>
</Accordion>
);
}

function UsersFilters({
roleFilter,
onRoleFilterChange,
searchQuery,
onSearch,
}: {
roleFilter: string;
onRoleFilterChange: (value: string) => void;
searchQuery: string;
onSearch: (term: string) => void;
}) {
return (
<Card>
<CardContent className="pt-6">
<div className="flex flex-wrap gap-3">
<Select
value={roleFilter}
onValueChange={onRoleFilterChange}
>
<SelectTrigger className="w-[180px]">
<SelectValue placeholder="All Roles" />
</SelectTrigger>
<SelectContent>
<SelectItem value="all">All Roles</SelectItem>
<SelectItem value="admin">
Administrators
</SelectItem>
<SelectItem value="user">
Regular Users
</SelectItem>
</SelectContent>
</Select>

<div className="flex gap-2 flex-1">
<Input
placeholder="Search by name, email, or ID..."
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
'input[placeholder="Search by name, email, or ID..."]',
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

function UsersDesktopTable({
users,
showTenant,
pagination,
startItem,
endItem,
onPageChange,
onOpenEdit,
onOpenRoleDialog,
}: {
users: User[];
showTenant: boolean;
pagination: PaginationProps;
startItem: number;
endItem: number;
onPageChange: (page: number) => void;
onOpenEdit: (u: User) => void;
onOpenRoleDialog: (u: User) => void;
}) {
return (
<Card className="hidden lg:block">
<div className="overflow-x-auto">
<Table>
<TableHeader>
<TableRow>
<TableHead className="w-[80px]">
Avatar
</TableHead>
<TableHead className="w-[200px]">
Name
</TableHead>
<TableHead className="w-[250px]">
Email
</TableHead>
{showTenant && (
<TableHead className="w-[150px]">
Tenant
</TableHead>
)}
<TableHead className="w-[120px]">
Role
</TableHead>
<TableHead className="w-[200px]">
Actions
</TableHead>
</TableRow>
</TableHeader>
<TableBody>
{users.length === 0 ? (
<TableRow>
<TableCell
colSpan={5}
className="text-center py-8 text-muted-foreground"
>
No users found
</TableCell>
</TableRow>
) : (
users.map((u) => (
<TableRow
key={u.id}
className="group hover:bg-muted/50 transition-colors border-b border-border/50"
>
<TableCell className="py-4">
<Avatar className="size-10 border border-border group-hover:border-primary/20 transition-all">
<AvatarImage
src={
u.profilePic ||
`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`
}
/>
<AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
{u.name
.slice(0, 2)
.toUpperCase()}
</AvatarFallback>
</Avatar>
</TableCell>
<TableCell>
<span className="font-semibold text-sm">
{u.name}
</span>
</TableCell>
<TableCell>
<span className="text-xs font-medium text-muted-foreground">
{u.email}
</span>
</TableCell>
{showTenant && (
<TableCell>
<Badge
variant="secondary"
className="text-[10px] font-semibold uppercase tracking-wider"
>
{u.tenant?.name ||
"GLOBAL NODE"}
</Badge>
</TableCell>
)}
<TableCell>
<Badge
className={cn(
getRoleColor(u.role?.name),
"text-[10px] font-bold uppercase tracking-wider border-none shadow-none text-white",
)}
>
{u.role?.name || "NO_ROLE"}
</Badge>
</TableCell>
<TableCell className="text-right">
<div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
<Button
size="icon"
variant="ghost"
className="size-8 rounded-full hover:bg-primary/5 hover:text-primary"
onClick={() => onOpenEdit(u)}
>
<Edit className="size-4" />
</Button>
<Button
size="icon"
variant="ghost"
className="size-8 rounded-full hover:bg-primary/5 hover:text-primary"
onClick={() => onOpenRoleDialog(u)}
>
<UserCog className="size-4" />
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
Showing {startItem} to {endItem} of{" "}
{pagination.totalItems} results
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
Previous
</Button>
<div className="hidden sm:flex items-center gap-1">
{Array.from(
{
length: Math.min(
5,
pagination.totalPages,
),
},
(_, i) => {
let pageNum;
if (pagination.totalPages <= 5) {
pageNum = i + 1;
} else if (
pagination.currentPage <= 3
) {
pageNum = i + 1;
} else if (
pagination.currentPage >=
pagination.totalPages - 2
) {
pageNum =
pagination.totalPages - 4 + i;
} else {
pageNum =
pagination.currentPage - 2 + i;
}
return (
<Button
key={pageNum}
variant={
pagination.currentPage ===
pageNum
? "default"
: "outline"
}
size="sm"
onClick={() =>
onPageChange(pageNum)
}
className="min-w-[2.5rem]"
>
{pageNum}
</Button>
);
},
)}
</div>
<div className="sm:hidden text-sm text-muted-foreground px-2">
Page {pagination.currentPage} of{" "}
{pagination.totalPages}
</div>
<Button
variant="outline"
size="sm"
onClick={() =>
onPageChange(pagination.currentPage + 1)
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

function UsersMobileCards({
users,
showTenant,
pagination,
onPageChange,
onOpenEdit,
onOpenRoleDialog,
}: {
users: User[];
showTenant: boolean;
pagination: PaginationProps;
onPageChange: (page: number) => void;
onOpenEdit: (u: User) => void;
onOpenRoleDialog: (u: User) => void;
}) {
return (
<div className="space-y-4 lg:hidden">
{users.map((u) => (
<Card key={u.id} className="t-card overflow-hidden">
<CardContent className="p-6 space-y-6">
<div className="flex items-center gap-4">
<Avatar className="size-14 border border-border shadow-sm">
<AvatarImage
src={
u.profilePic ||
`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`
}
/>
<AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
{u.name.slice(0, 2).toUpperCase()}
</AvatarFallback>
</Avatar>
<div className="flex-1 min-w-0 space-y-1">
<h3 className="font-bold text-lg tracking-tight text-foreground truncate">
{u.name}
</h3>
<p className="text-xs font-medium text-muted-foreground truncate">
{u.email}
</p>
<div className="flex flex-wrap gap-2 mt-2">
<Badge
className={cn(
getRoleColor(u.role?.name),
"text-[9px] font-bold uppercase tracking-wider text-white",
)}
>
{u.role?.name || "NO_ROLE"}
</Badge>
{showTenant && (
<Badge
variant="secondary"
className="text-[9px] font-bold uppercase tracking-wider"
>
{u.tenant?.name ||
"GLOBAL NODE"}
</Badge>
)}
</div>
</div>
</div>

<div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
<Button
size="sm"
variant="outline"
className="w-full h-10 font-semibold text-xs"
onClick={() => onOpenEdit(u)}
>
<Edit size={14} className="mr-2" /> Edit
</Button>
<Button
size="sm"
variant="outline"
onClick={() => onOpenRoleDialog(u)}
className="w-full h-10 font-semibold text-xs"
>
<UserCog size={14} className="mr-2" /> Role
</Button>
</div>
</CardContent>
</Card>
))}

{pagination.totalItems > 0 && (
<Card className="lg:hidden">
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
Page {pagination.currentPage} of{" "}
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

export default function UsersTableClient(props: Props) {
  return (
    <Suspense fallback={<div className="p-6" />}>
      <UsersTableClientInner {...props} />
    </Suspense>
  );
}

function UsersTableClientInner({
users,
stats,
pagination,
showTenant = false,
}: Props) {
const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
const router = useRouter();
const searchParams = useSearchParams();

const [dialogState, dispatch] = useReducer(usersDialogReducer, {
editOpen: false,
form: { name: "", email: "", tenantId: "" },
roleDialogOpen: false,
selectedUser: null,
isSaving: false,
tenants: [],
isLoadingTenants: false,
});
const editingRef = useRef<User | null>(null);

const fetchTenants = useCallback(async () => {
dispatch({ type: "SET_IS_LOADING_TENANTS", payload: true });
try {
const data = await tenantService.getAll();
dispatch({ type: "SET_TENANTS", payload: data });
} catch (err) {
console.error("Failed to fetch tenants:", err);
} finally {
dispatch({ type: "SET_IS_LOADING_TENANTS", payload: false });
}
}, []);

	const fetchTenantsIfNeeded = () => {
		if (showTenant && dialogState.tenants.length === 0 && !dialogState.isLoadingTenants) {
			fetchTenants();
		}
	};

	const searchQuery = searchParams.get("search") || "";
	const roleFilter = searchParams.get("role") || "all";

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

const handleRoleFilterChange = (newFilter: string) => {
const params = new URLSearchParams(searchParams);
if (newFilter && newFilter !== "all") {
params.set("role", newFilter);
} else {
params.delete("role");
}
params.set("page", "1");
router.push(`?${params.toString()}`);
};

const handlePageChange = (newPage: number) => {
const params = new URLSearchParams(searchParams);
params.set("page", newPage.toString());
router.push(`?${params.toString()}`);
};

	const openEdit = (u: User) => {
		fetchTenantsIfNeeded();
		editingRef.current = u;
dispatch({ type: "SET_FORM", payload: {
name: u.name,
email: u.email,
tenantId: u.tenantId,
}});
dispatch({ type: "SET_EDIT_OPEN", payload: true });
};

const openRoleDialog = (u: User) => {
dispatch({ type: "SET_SELECTED_USER", payload: u });
dispatch({ type: "SET_ROLE_DIALOG_OPEN", payload: true });
};

const saveEdit = async () => {
if (!editingRef.current) return;
dispatch({ type: "SET_IS_SAVING", payload: true });
try {
await usersService.update(editingRef.current.id, {
name: dialogState.form.name,
email: dialogState.form.email,
tenantId: showTenant ? dialogState.form.tenantId : undefined,
});
toast.success("User updated");
dispatch({ type: "SET_EDIT_OPEN", payload: false });
editingRef.current = null;
dispatch({ type: "SET_FORM", payload: { name: "", email: "", tenantId: "" } });
router.refresh();
} catch (err) {
const message =
err instanceof ApiError ? err.message : "Failed to update user";
toast.error(message);
} finally {
dispatch({ type: "SET_IS_SAVING", payload: false });
}
};

const startItem =
users.length > 0
? (pagination.currentPage - 1) * pagination.itemsPerPage + 1
: 0;
const endItem = Math.min(
pagination.currentPage * pagination.itemsPerPage,
pagination.totalItems,
);

if (!isMounted) return null;

return (
<div className="w-full space-y-6" suppressHydrationWarning>
<div className="flex justify-between items-center">
<h2 className="text-xl font-medium">Users Management</h2>
</div>

<UsersDesktopStats stats={stats} />
<UsersMobileStats stats={stats} />
<UsersFilters
roleFilter={roleFilter}
onRoleFilterChange={handleRoleFilterChange}
searchQuery={searchQuery}
onSearch={handleSearch}
/>
<UsersDesktopTable
users={users}
showTenant={showTenant}
pagination={pagination}
startItem={startItem}
endItem={endItem}
onPageChange={handlePageChange}
onOpenEdit={openEdit}
onOpenRoleDialog={openRoleDialog}
/>
<UsersMobileCards
users={users}
showTenant={showTenant}
pagination={pagination}
onPageChange={handlePageChange}
onOpenEdit={openEdit}
onOpenRoleDialog={openRoleDialog}
/>

<EditUserDialog
open={dialogState.editOpen}
onOpenChange={(open) => dispatch({ type: "SET_EDIT_OPEN", payload: open })}
form={dialogState.form}
setForm={(f) => dispatch({ type: "SET_FORM", payload: typeof f === "function" ? f(dialogState.form) : f })}
showTenant={showTenant}
tenants={dialogState.tenants}
isLoadingTenants={dialogState.isLoadingTenants}
isSaving={dialogState.isSaving}
onSave={saveEdit}
/>
<AssignRoleDialog
user={dialogState.selectedUser}
open={dialogState.roleDialogOpen}
onOpenChange={(open) => dispatch({ type: "SET_ROLE_DIALOG_OPEN", payload: open })}
onSuccess={() => router.refresh()}
/>
</div>
);
}
