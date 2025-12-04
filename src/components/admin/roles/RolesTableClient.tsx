"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { rolesService, permissionsService } from "@/services";
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
} from "lucide-react";

import { Role } from "@/types/role.types";
import { Permission } from "@/types/permission.types";

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

type Props = {
    roles: Role[];
    permissions: Permission[];
    stats: Stats;
    rolePagination: Pagination;
    permissionPagination: Pagination;
};

export default function RolesTableClient({ roles, permissions, stats, rolePagination, permissionPagination }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Roles state
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        level: 1,
        permissionIds: [] as string[],
    });

    // Permissions state
    const [permCreateOpen, setPermCreateOpen] = useState(false);
    const [permEditOpen, setPermEditOpen] = useState(false);
    const [permEditing, setPermEditing] = useState<Permission | null>(null);
    const [permForm, setPermForm] = useState({
        name: "",
        description: "",
    });

    // Helper function to refresh permissions cache
    const refreshPermissions = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/validate`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
            }
        } catch (err) {
            console.error('Failed to refresh permissions:', err);
        }
    };

    // Roles handlers
    const openCreate = () => {
        setForm({ name: "", description: "", level: 1, permissionIds: [] });
        setCreateOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditing(role);
        setForm({
            name: role.name,
            description: role.description || "",
            level: role.level || 1,
            permissionIds: role.permissions?.map((p: any) => p.id) || [],
        });
        setEditOpen(true);
    };

    const handleCreate = async () => {
        if (!form.name) {
            toast.error("Role name is required");
            return;
        }

        try {
            await rolesService.create(form);
            toast.success("Role created successfully");
            setCreateOpen(false);

            // Refresh permissions cache in backend
            await refreshPermissions();

            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to create role";
            toast.error(message);
        }
    };

    const handleUpdate = async () => {
        if (!editing) return;

        try {
            await rolesService.update(editing.id, form);
            toast.success("Role updated successfully");
            setEditOpen(false);

            // Refresh permissions cache in backend
            await refreshPermissions();

            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to update role";
            toast.error(message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this role?")) return;

        try {
            await rolesService.delete(id);
            toast.success("Role deleted successfully");
            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to delete role";
            toast.error(message);
        }
    };

    const togglePermission = (permissionId: string) => {
        setForm((prev) => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(permissionId)
                ? prev.permissionIds.filter((id) => id !== permissionId)
                : [...prev.permissionIds, permissionId],
        }));
    };

    // Permission handlers
    const openPermCreate = () => {
        setPermForm({ name: "", description: "" });
        setPermCreateOpen(true);
    };

    const openPermEdit = (permission: Permission) => {
        setPermEditing(permission);
        setPermForm({
            name: permission.name,
            description: permission.description || "",
        });
        setPermEditOpen(true);
    };

    const handlePermCreate = async () => {
        if (!permForm.name) {
            toast.error("Permission name is required");
            return;
        }

        try {
            await permissionsService.create(permForm);
            toast.success("Permission created successfully");
            setPermCreateOpen(false);
            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to create permission";
            toast.error(message);
        }
    };

    const handlePermUpdate = async () => {
        if (!permEditing) return;

        try {
            await permissionsService.update(permEditing.id, permForm);
            toast.success("Permission updated successfully");
            setPermEditOpen(false);
            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to update permission";
            toast.error(message);
        }
    };

    const handlePermDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this permission?")) return;

        try {
            await permissionsService.delete(id);
            toast.success("Permission deleted successfully");
            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to delete permission";
            toast.error(message);
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

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">Roles & Permissions Management</h2>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard icon={Shield} title="Total Roles" value={stats.totalRoles} color="bg-purple-500" />
                <StatCard icon={Key} title="Total Permissions" value={stats.totalPermissions} color="bg-blue-500" />
            </div>

            {/* Tabs for Roles and Permissions */}
            <Tabs defaultValue="roles" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                {/* Roles Tab */}
                <TabsContent value="roles" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Role
                        </Button>
                    </div>

                    {/* Desktop Table View */}
                    <Card className="hidden lg:block">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Name</TableHead>
                                        <TableHead className="w-[300px]">Description</TableHead>
                                        <TableHead className="w-[100px]">Level</TableHead>
                                        <TableHead className="w-[150px]">Permissions</TableHead>
                                        <TableHead className="w-[150px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No roles found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        roles.map((role) => (
                                            <TableRow key={role.id} className="hover:bg-muted/30">
                                                <TableCell className="font-medium">{role.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {role.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{role.level || 0}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {role.permissions?.length || 0} permissions
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="ghost" onClick={() => openEdit(role)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(role.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Roles Pagination */}
                        {rolePagination.totalItems > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((rolePagination.currentPage - 1) * rolePagination.itemsPerPage) + 1} to {Math.min(rolePagination.currentPage * rolePagination.itemsPerPage, rolePagination.totalItems)} of {rolePagination.totalItems} results
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set("rolePage", (rolePagination.currentPage - 1).toString());
                                            router.push(`?${params.toString()}`);
                                        }}
                                        disabled={rolePagination.currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, rolePagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (rolePagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (rolePagination.currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (rolePagination.currentPage >= rolePagination.totalPages - 2) {
                                                pageNum = rolePagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = rolePagination.currentPage - 2 + i;
                                            }
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={rolePagination.currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.set("rolePage", pageNum.toString());
                                                        router.push(`?${params.toString()}`);
                                                    }}
                                                    className="min-w-[2.5rem]"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <div className="sm:hidden text-sm text-muted-foreground px-2">
                                        Page {rolePagination.currentPage} of {rolePagination.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set("rolePage", (rolePagination.currentPage + 1).toString());
                                            router.push(`?${params.toString()}`);
                                        }}
                                        disabled={rolePagination.currentPage === rolePagination.totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Mobile Card View */}
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
                                                <h3 className="font-semibold text-lg">{role.name}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {role.description || "No description"}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="ml-2">
                                                Level {role.level || 0}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <Badge variant="secondary">
                                                {role.permissions?.length || 0} permissions
                                            </Badge>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => openEdit(role)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleDelete(role.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        {/* Mobile Pagination */}
                        {rolePagination.totalItems > 0 && (
                            <Card className="col-span-full">
                                <div className="flex items-center justify-between px-4 py-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set("rolePage", (rolePagination.currentPage - 1).toString());
                                            router.push(`?${params.toString()}`);
                                        }}
                                        disabled={rolePagination.currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {rolePagination.currentPage} of {rolePagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set("rolePage", (rolePagination.currentPage + 1).toString());
                                            router.push(`?${params.toString()}`);
                                        }}
                                        disabled={rolePagination.currentPage === rolePagination.totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={openPermCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Permission
                        </Button>
                    </div>

                    {/* Desktop Table View */}
                    <Card className="hidden lg:block">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Name</TableHead>
                                        <TableHead className="w-[400px]">Description</TableHead>
                                        <TableHead className="w-[150px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                No permissions found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        permissions.map((permission) => (
                                            <TableRow key={permission.id} className="hover:bg-muted/30">
                                                <TableCell className="font-medium">{permission.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {permission.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="ghost" onClick={() => openPermEdit(permission)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handlePermDelete(permission.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Permissions Pagination */}
                        {permissionPagination.totalItems > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((permissionPagination.currentPage - 1) * permissionPagination.itemsPerPage) + 1} to {Math.min(permissionPagination.currentPage * permissionPagination.itemsPerPage, permissionPagination.totalItems)} of {permissionPagination.totalItems} results
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set("permissionPage", (permissionPagination.currentPage - 1).toString());
                                            router.push(`?${params.toString()}`);
                                        }}
                                        disabled={permissionPagination.currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, permissionPagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (permissionPagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (permissionPagination.currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (permissionPagination.currentPage >= permissionPagination.totalPages - 2) {
                                                pageNum = permissionPagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = permissionPagination.currentPage - 2 + i;
                                            }
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={permissionPagination.currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.set("permissionPage", pageNum.toString());
                                                        router.push(`?${params.toString()}`);
                                                    }}
                                                    className="min-w-[2.5rem]"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <div className="sm:hidden text-sm text-muted-foreground px-2">
                                        Page {permissionPagination.currentPage} of {permissionPagination.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set("permissionPage", (permissionPagination.currentPage + 1).toString());
                                            router.push(`?${params.toString()}`);
                                        }}
                                        disabled={permissionPagination.currentPage === permissionPagination.totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Mobile Card View */}
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {permissions.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No permissions found
                                </CardContent>
                            </Card>
                        ) : (
                            permissions.map((permission) => (
                                <Card key={permission.id} className="overflow-hidden">
                                    <CardContent className="p-4 space-y-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Key className="h-4 w-4 text-muted-foreground" />
                                                <h3 className="font-semibold text-lg">{permission.name}</h3>
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
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handlePermDelete(permission.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        {/* Mobile Pagination */}
                        {permissionPagination.totalItems > 0 && (
                            <Card className="col-span-full">
                                <div className="flex items-center justify-between px-4 py-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set("permissionPage", (permissionPagination.currentPage - 1).toString());
                                            router.push(`?${params.toString()}`);
                                        }}
                                        disabled={permissionPagination.currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {permissionPagination.currentPage} of {permissionPagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set("permissionPage", (permissionPagination.currentPage + 1).toString());
                                            router.push(`?${params.toString()}`);
                                        }}
                                        disabled={permissionPagination.currentPage === permissionPagination.totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Create Role Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Role Name*</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g., EDITOR"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Role description"
                            />
                        </div>
                        <div>
                            <Label htmlFor="level">Level</Label>
                            <Input
                                id="level"
                                type="number"
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 1 })}
                                min={1}
                            />
                        </div>
                        <div>
                            <Label>Permissions</Label>
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={permission.id}
                                            checked={form.permissionIds.includes(permission.id)}
                                            onCheckedChange={() => togglePermission(permission.id)}
                                        />
                                        <label
                                            htmlFor={permission.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {permission.name}
                                            {permission.description && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ({permission.description})
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>Create Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Role Name*</Label>
                            <Input
                                id="edit-name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-level">Level</Label>
                            <Input
                                id="edit-level"
                                type="number"
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 1 })}
                                min={1}
                            />
                        </div>
                        <div>
                            <Label>Permissions</Label>
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-${permission.id}`}
                                            checked={form.permissionIds.includes(permission.id)}
                                            onCheckedChange={() => togglePermission(permission.id)}
                                        />
                                        <label
                                            htmlFor={`edit-${permission.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {permission.name}
                                            {permission.description && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ({permission.description})
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate}>Update Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Permission Dialog */}
            <Dialog open={permCreateOpen} onOpenChange={setPermCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Permission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="perm-name">Permission Name*</Label>
                            <Input
                                id="perm-name"
                                value={permForm.name}
                                onChange={(e) => setPermForm({ ...permForm, name: e.target.value })}
                                placeholder="e.g., users:read, products:write"
                            />
                        </div>
                        <div>
                            <Label htmlFor="perm-description">Description</Label>
                            <Input
                                id="perm-description"
                                value={permForm.description}
                                onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
                                placeholder="Permission description"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPermCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePermCreate}>Create Permission</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Permission Dialog */}
            <Dialog open={permEditOpen} onOpenChange={setPermEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Permission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-perm-name">Permission Name*</Label>
                            <Input
                                id="edit-perm-name"
                                value={permForm.name}
                                onChange={(e) => setPermForm({ ...permForm, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-perm-description">Description</Label>
                            <Input
                                id="edit-perm-description"
                                value={permForm.description}
                                onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPermEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePermUpdate}>Update Permission</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
