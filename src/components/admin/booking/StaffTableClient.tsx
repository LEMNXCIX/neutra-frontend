"use client";

import React, { useReducer, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
Plus,
Edit,
Trash2,
Mail,
Phone,
Info,
User as UserIcon,
Scissors,
Check,
} from "lucide-react";
import { bookingService, Staff, Service } from "@/services/booking.service";
import { usersService } from "@/services/users.service";
import { User } from "@/types/user.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogFooter,
DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConfirm } from "@/hooks/use-confirm";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";

interface Props {
staff: Staff[];
isSuperAdmin?: boolean;
}

function ServiceAssignmentDialog({
open,
onOpenChange,
editingStaff,
allServices,
selectedServiceIds,
onToggleService,
isSaving,
onSave,
}: {
open: boolean;
onOpenChange: (open: boolean) => void;
editingStaff: Staff | null;
allServices: Service[];
selectedServiceIds: string[];
onToggleService: (id: string) => void;
isSaving: boolean;
onSave: () => void;
}) {
return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="sm:max-w-[500px]">
<DialogHeader>
<DialogTitle>Assign Services to {editingStaff?.name}</DialogTitle>
<DialogDescription>Select the services this staff member is qualified to perform.</DialogDescription>
</DialogHeader>
<div className="py-4 h-[400px] overflow-y-auto">
{allServices.length === 0 ? (
<div className="text-center py-8"><p className="text-muted-foreground">No services found. Create some services first.</p></div>
) : (
<div className="grid gap-3">
{allServices.map((service) => (
<button key={service.id} type="button" tabIndex={0}
className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer hover:bg-accent/50 ${selectedServiceIds.includes(service.id) ? "bg-primary/5 border-primary/30" : ""}`}
onClick={() => onToggleService(service.id)}
onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleService(service.id); } }}
>
<div className="flex flex-col gap-0.5">
<span className="font-medium text-sm">{service.name}</span>
<div className="flex items-center gap-2 text-xs text-muted-foreground">
<span>{service.duration} min</span><span>•</span><span>${service.price}</span>
</div>
</div>
<div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedServiceIds.includes(service.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
{selectedServiceIds.includes(service.id) && <Check className="size-3.5" />}
</div>
</button>
))}
</div>
)}
</div>
<DialogFooter className="pt-2">
<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
<Button type="button" onClick={onSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Assignments"}</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}

function StaffHeader({
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
Staff Management
</h1>
<p className="text-muted-foreground mt-1">
Professional staff members available for bookings.
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
Add Staff Member
</Button>
</div>
</div>
);
}

function StaffEmptyState({ onCreate }: { onCreate: () => void }) {
return (
<Card className="flex flex-col items-center justify-center py-12 px-4 text-center">
<div className="bg-muted rounded-full p-4 mb-4">
<UserIcon className="size-8 text-muted-foreground" />
</div>
<CardTitle>No staff members found</CardTitle>
<CardDescription className="max-w-[400px] mt-2">
Add your first staff member to start managing
appointments and services.
</CardDescription>
<Button
variant="outline"
className="mt-6"
onClick={onCreate}
>
<Plus className="size-4 mr-2" />
Add Staff Member
</Button>
</Card>
);
}

function StaffCardsGrid({
staff,
isSuperAdmin,
onEdit,
onServiceAssignment,
onDelete,
}: {
staff: Staff[];
isSuperAdmin: boolean;
onEdit: (member: Staff) => void;
onServiceAssignment: (member: Staff) => void;
onDelete: (id: string) => void;
}) {
return (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{staff.map((member) => (
<Card
key={member.id}
className="overflow-hidden group hover:border-primary/50 transition-all active:scale-[0.98]"
>
<CardHeader className="flex flex-row items-start gap-4">
<Avatar className="size-14 border-2 border-background group-hover:border-primary/20 transition-colors">
<AvatarImage src={member.avatar} />
<AvatarFallback className="bg-primary/10 text-primary">
{member.name
.split(" ")
.map((n) => n[0])
.join("")
.toUpperCase()}
</AvatarFallback>
</Avatar>
<div className="flex-1 min-w-0">
<div className="flex items-center justify-between gap-2">
<CardTitle className="text-lg truncate">
{member.name}
</CardTitle>
<Badge
variant={
member.active
? "default"
: "secondary"
}
className="shrink-0"
>
{member.active
? "Active"
: "Inactive"}
</Badge>
</div>
<CardDescription className="line-clamp-1">
Staff Member{" "}
{isSuperAdmin && (
<span className="text-[10px] font-mono opacity-50 ml-1">
({member.tenantId})
</span>
)}
</CardDescription>
</div>
</CardHeader>
<CardContent className="space-y-4">
{member.bio && (
<p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
{member.bio}
</p>
)}
<div className="space-y-2">
{member.email && (
<div className="flex items-center text-sm text-muted-foreground">
<Mail className="size-4 mr-2 opacity-70" />
<span className="truncate">
{member.email}
</span>
</div>
)}
{member.phone && (
<div className="flex items-center text-sm text-muted-foreground">
<Phone className="size-4 mr-2 opacity-70" />
<span>{member.phone}</span>
</div>
)}
</div>
</CardContent>
<CardFooter className="bg-muted/30 pt-4 flex justify-between gap-2">
<div className="flex gap-2">
<Button
variant="ghost"
size="sm"
className="hover:bg-background"
onClick={() => onEdit(member)}
>
<Edit className="size-4 mr-2" />
Profile
</Button>
<Button
variant="ghost"
size="sm"
className="hover:bg-background"
onClick={() =>
onServiceAssignment(member)
}
>
<Scissors className="size-4 mr-2" />
Services (
{member.serviceIds?.length || 0})
</Button>
</div>
<Button
variant="ghost"
size="sm"
className="text-destructive hover:bg-destructive/10 hover:text-destructive"
onClick={() => onDelete(member.id)}
>
<Trash2 className="size-4" />
</Button>
</CardFooter>
</Card>
))}
</div>
);
}

function StaffFormDialog({
dialogOpen,
isSaving,
editingStaff,
formData,
allUsers,
onDialogOpenChange,
onFormChange,
onSubmit,
}: {
dialogOpen: boolean;
isSaving: boolean;
editingStaff: Staff | null;
formData: StaffState["formData"];
allUsers: User[];
onDialogOpenChange: (open: boolean) => void;
onFormChange: (f: StaffState["formData"]) => void;
onSubmit: (e: React.FormEvent) => void;
}) {
return (
<Dialog
open={dialogOpen}
onOpenChange={onDialogOpenChange}
>
<DialogContent className="sm:max-w-[500px]">
<DialogHeader>
<DialogTitle>
{editingStaff
? "Edit Staff Profile"
: "Add Staff Member"}
</DialogTitle>
<DialogDescription>
{editingStaff
? "Update professional information for this team member."
: "Create a new professional profile for your team."}
</DialogDescription>
</DialogHeader>
<form onSubmit={onSubmit} className="space-y-5 pt-4">
<div className="grid gap-2">
<Label htmlFor="user">
Link Registered User (Optional)
</Label>
<Select
value={formData.userId}
onValueChange={(value) => {
const user = allUsers.find(
(u) => u.id === value,
);
onFormChange({
...formData,
userId: value,
name: user?.name || formData.name,
email: user?.email || formData.email,
});
}}
>
<SelectTrigger>
<SelectValue placeholder="Select a user to link..." />
</SelectTrigger>
<SelectContent>
<SelectItem value="none">
None (Individual Staff)
</SelectItem>
{allUsers.map((user) => (
<SelectItem
key={user.id}
value={user.id}
>
{user.name} ({user.email})
</SelectItem>
))}
</SelectContent>
</Select>
</div>
<div className="grid gap-2">
<Label htmlFor="name">Full Name *</Label>
<Input
id="name"
required
value={formData.name}
onChange={(e) =>
onFormChange({
...formData,
name: e.target.value,
})
}
placeholder="e.g. Jane Doe"
/>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="grid gap-2">
<Label htmlFor="email">Email Address</Label>
<Input
id="email"
type="email"
value={formData.email}
onChange={(e) =>
onFormChange({
...formData,
email: e.target.value,
})
}
placeholder="jane@example.com"
/>
</div>
<div className="grid gap-2">
<Label htmlFor="phone">Phone Number</Label>
<Input
id="phone"
type="tel"
value={formData.phone}
onChange={(e) =>
onFormChange({
...formData,
phone: e.target.value,
})
}
placeholder="+1 (555) 000-0000"
/>
</div>
</div>
<div className="grid gap-2">
<Label htmlFor="bio">Professional Bio</Label>
<Textarea
id="bio"
value={formData.bio}
onChange={(e) =>
onFormChange({
...formData,
bio: e.target.value,
})
}
placeholder="Briefly describe their expertise..."
rows={3}
/>
</div>
<div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
<div className="space-y-0.5">
<Label
htmlFor="active"
className="text-sm font-medium"
>
Active Status
</Label>
<p className="text-xs text-muted-foreground">
Enable bookings for this member
</p>
</div>
<Switch
id="active"
checked={formData.active}
onCheckedChange={(checked) =>
onFormChange({
...formData,
active: checked,
})
}
/>
</div>
<DialogFooter className="pt-2">
<Button
type="button"
variant="outline"
onClick={() => onDialogOpenChange(false)}
disabled={isSaving}
>
Cancel
</Button>
<Button type="submit" disabled={isSaving}>
{isSaving
? "Saving..."
: editingStaff
? "Update Profile"
: "Add Staff Member"}
</Button>
</DialogFooter>
</form>
</DialogContent>
</Dialog>
);
}

type StaffState = {
staff: Staff[];
loading: boolean;
dialogOpen: boolean;
isSaving: boolean;
editingStaff: Staff | null;
allUsers: User[];
formData: {
userId: string;
name: string;
email: string;
phone: string;
bio: string;
active: boolean;
};
allServices: Service[];
serviceDialogOpen: boolean;
selectedServiceIds: string[];
isSavingServices: boolean;
};

type StaffAction =
| { type: "SET_STAFF"; payload: Staff[] }
| { type: "SET_LOADING"; payload: boolean }
| { type: "SET_DIALOG_OPEN"; payload: boolean }
| { type: "SET_IS_SAVING"; payload: boolean }
| { type: "SET_EDITING_STAFF"; payload: Staff | null }
| { type: "SET_ALL_USERS"; payload: User[] }
| { type: "SET_FORM_DATA"; payload: StaffState["formData"] }
| { type: "SET_ALL_SERVICES"; payload: Service[] }
| { type: "SET_SERVICE_DIALOG_OPEN"; payload: boolean }
| { type: "SET_SELECTED_SERVICE_IDS"; payload: string[] }
| { type: "SET_IS_SAVING_SERVICES"; payload: boolean };

function staffReducer(state: StaffState, action: StaffAction): StaffState {
switch (action.type) {
case "SET_STAFF":
return { ...state, staff: action.payload };
case "SET_LOADING":
return { ...state, loading: action.payload };
case "SET_DIALOG_OPEN":
return { ...state, dialogOpen: action.payload };
case "SET_IS_SAVING":
return { ...state, isSaving: action.payload };
case "SET_EDITING_STAFF":
return { ...state, editingStaff: action.payload };
case "SET_ALL_USERS":
return { ...state, allUsers: action.payload };
case "SET_FORM_DATA":
return { ...state, formData: action.payload };
case "SET_ALL_SERVICES":
return { ...state, allServices: action.payload };
case "SET_SERVICE_DIALOG_OPEN":
return { ...state, serviceDialogOpen: action.payload };
case "SET_SELECTED_SERVICE_IDS":
return { ...state, selectedServiceIds: action.payload };
case "SET_IS_SAVING_SERVICES":
return { ...state, isSavingServices: action.payload };
default:
return state;
}
}

function StaffTableClientInner({
  staff: initialStaff,
  isSuperAdmin = false,
}: Props) {
const router = useRouter();
const searchParams = useSearchParams();
const [state, dispatch] = useReducer(staffReducer, {
staff: initialStaff || [],
loading: false,
dialogOpen: false,
isSaving: false,
editingStaff: null,
allUsers: [],
formData: {
userId: "",
name: "",
email: "",
phone: "",
bio: "",
active: true,
},
allServices: [],
serviceDialogOpen: false,
selectedServiceIds: [],
isSavingServices: false,
});
const { staff, loading, dialogOpen, isSaving, editingStaff, allUsers, formData, allServices, serviceDialogOpen, selectedServiceIds, isSavingServices } = state;
const { confirm, ConfirmDialog } = useConfirm();

const tenantFilter = searchParams.get("tenantId") || "all";

const loadUsers = useCallback(async () => {
try {
const data = await usersService.getAll();
dispatch({ type: "SET_ALL_USERS", payload: data });
} catch (err) {
console.error("Error loading users:", err);
}
}, []);

const loadServices = useCallback(async () => {
try {
const data = await bookingService.getServices(false);
dispatch({ type: "SET_ALL_SERVICES", payload: data });
} catch (err) {
console.error("Error loading services:", err);
}
}, []);

const loadStaff = useCallback(async () => {
try {
dispatch({ type: "SET_LOADING", payload: true });
const data = await bookingService.getStaff(
false,
tenantFilter === "all" ? undefined : tenantFilter,
);
dispatch({ type: "SET_STAFF", payload: data });
} catch (err) {
console.error("Error loading staff:", err);
toast.error("Failed to load staff members");
} finally {
dispatch({ type: "SET_LOADING", payload: false });
}
}, [tenantFilter]);

useEffect(() => {
loadServices();
loadUsers();
if (!initialStaff || initialStaff.length === 0) {
loadStaff();
}
}, [loadServices, loadUsers, loadStaff, initialStaff]);

const handleTenantFilterChange = (value: string) => {
const params = new URLSearchParams(searchParams);
if (value === "all") {
params.delete("tenantId");
} else {
params.set("tenantId", value);
}
router.push(`?${params.toString()}`);
};

const openCreate = () => {
dispatch({ type: "SET_EDITING_STAFF", payload: null });
dispatch({ type: "SET_FORM_DATA", payload: {
userId: "",
name: "",
email: "",
phone: "",
bio: "",
active: true,
}});
dispatch({ type: "SET_DIALOG_OPEN", payload: true });
};

const openEdit = (member: Staff) => {
dispatch({ type: "SET_EDITING_STAFF", payload: member });
dispatch({ type: "SET_FORM_DATA", payload: {
userId: member.userId || "",
name: member.name,
email: member.email || "",
phone: member.phone || "",
bio: member.bio || "",
active: member.active,
}});
dispatch({ type: "SET_DIALOG_OPEN", payload: true });
};

const openServiceAssignment = (member: Staff) => {
dispatch({ type: "SET_EDITING_STAFF", payload: member });
dispatch({ type: "SET_SELECTED_SERVICE_IDS", payload: member.serviceIds || [] });
dispatch({ type: "SET_SERVICE_DIALOG_OPEN", payload: true });
};

const handleServiceToggle = (serviceId: string) => {
dispatch({
type: "SET_SELECTED_SERVICE_IDS",
payload: selectedServiceIds.includes(serviceId)
? selectedServiceIds.filter((id) => id !== serviceId)
: [...selectedServiceIds, serviceId],
});
};

const handleSaveServices = async () => {
if (!editingStaff) return;
dispatch({ type: "SET_IS_SAVING_SERVICES", payload: true });

try {
await bookingService.syncStaffServices(
editingStaff!.id,
selectedServiceIds,
);
toast.success("Services assigned successfully");
dispatch({ type: "SET_SERVICE_DIALOG_OPEN", payload: false });
await loadStaff();
} catch (err) {
console.error("Error saving staff services:", err);
toast.error("Failed to assign services");
} finally {
dispatch({ type: "SET_IS_SAVING_SERVICES", payload: false });
}
};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
dispatch({ type: "SET_IS_SAVING", payload: true });

try {
const url = editingStaff
? `/api/staff/${editingStaff.id}`
: "/api/staff";
const method = editingStaff ? "PUT" : "POST";

const payload = {
...formData,
userId:
formData.userId === "none" ? undefined : formData.userId,
};

const response = await fetch(url, {
method,
headers: { "Content-Type": "application/json" },
body: JSON.stringify(payload),
});

if (response.ok) {
toast.success(
`Staff member ${editingStaff ? "updated" : "added"} successfully`,
);
dispatch({ type: "SET_DIALOG_OPEN", payload: false });
await loadStaff();
} else {
const errorData = await response.json();
toast.error(
errorData.message ||
`Failed to ${editingStaff ? "update" : "add"} staff member`,
);
}
} catch (err) {
console.error(
`Error ${editingStaff ? "updating" : "creating"} staff:`,
err,
);
toast.error("An unexpected error occurred");
} finally {
dispatch({ type: "SET_IS_SAVING", payload: false });
}
};

const handleDelete = async (id: string) => {
const confirmed = await confirm({
title: "Delete Staff Member",
description:
"Are you sure you want to remove this staff member? This action cannot be undone.",
confirmText: "Delete",
variant: "destructive",
});

if (!confirmed) return;

try {
const response = await fetch(`/api/staff/${id}`, {
method: "DELETE",
});

if (response.ok) {
toast.success("Staff member removed successfully");
await loadStaff();
} else {
const errorData = await response.json();
toast.error(
errorData.message || "Failed to remove staff member",
);
}
} catch (err) {
console.error("Error deleting staff:", err);
toast.error("An unexpected error occurred");
}
};

if (loading) {
return (
<div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
<Spinner className="size-8 text-primary" />
<p className="text-muted-foreground animate-pulse">
Loading staff members…
</p>
</div>
);
}

return (
<div className="space-y-6">
<ConfirmDialog />
<StaffHeader
isSuperAdmin={isSuperAdmin}
tenantFilter={tenantFilter}
onTenantFilterChange={handleTenantFilterChange}
onCreate={openCreate}
/>
{staff.length === 0 ? (
<StaffEmptyState onCreate={openCreate} />
) : (
<StaffCardsGrid
staff={staff}
isSuperAdmin={isSuperAdmin}
onEdit={openEdit}
onServiceAssignment={openServiceAssignment}
onDelete={handleDelete}
/>
)}
<StaffFormDialog
dialogOpen={dialogOpen}
isSaving={isSaving}
editingStaff={editingStaff}
formData={formData}
allUsers={allUsers}
onDialogOpenChange={(open) => {
if (!isSaving) dispatch({ type: "SET_DIALOG_OPEN", payload: open });
}}
onFormChange={(f: StaffState["formData"]) => dispatch({ type: "SET_FORM_DATA", payload: f })}
onSubmit={handleSubmit}
/>
<ServiceAssignmentDialog
open={serviceDialogOpen}
onOpenChange={(open) => { if (!isSavingServices) dispatch({ type: "SET_SERVICE_DIALOG_OPEN", payload: open }); }}
editingStaff={editingStaff}
allServices={allServices}
selectedServiceIds={selectedServiceIds}
onToggleService={handleServiceToggle}
isSaving={isSavingServices}
onSave={handleSaveServices}
        />
        </div>
      );
    }

export default function StaffTableClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <StaffTableClientInner {...props} />
    </Suspense>
  );
}
