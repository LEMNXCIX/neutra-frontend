"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { usersService } from "@/services";
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
};

export default function UsersTableClient({ users, stats, pagination }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Dialog states
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [form, setForm] = useState({ name: "", email: "" });
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // URL State
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



    const isUserAdmin = (u: User) => u.role?.name === 'SUPER_ADMIN' || u.role?.name === 'ADMIN';

    const openEdit = (u: User) => {
        setEditing(u);
        setForm({
            name: u.name,
            email: u.email,
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        setIsSaving(true);
        try {
            await usersService.update(editing.id, {
                name: form.name,
                email: form.email,
            });
            toast.success("User updated");
            setEditOpen(false);
            setEditing(null);
            setForm({ name: "", email: "" });
            router.refresh();
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to update user";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    // Helper function to get role badge color
    const getRoleColor = (roleName?: string) => {
        if (!roleName) return "bg-gray-500";

        switch (roleName.toUpperCase()) {
            case 'SUPER_ADMIN':
                return "bg-pink-600";
            case 'ADMIN':
                return "bg-purple-500";
            case 'MANAGER':
                return "bg-blue-500";
            case 'MODERATOR':
                return "bg-green-500";
            case 'USER':
                return "bg-gray-500";
            default:
                return "bg-slate-500";
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

    const startItem = users.length > 0 ? ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1 : 0;
    const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">Users Management</h2>
            </div>

            {/* Statistics – Desktop: 3 columns */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                <StatCard icon={Users} title="Total Users" value={stats.totalUsers} color="bg-blue-500" />
                <StatCard icon={Shield} title="Administrators" value={stats.adminUsers} color="bg-purple-500" />
                <StatCard icon={UserCircle} title="Regular Users" value={stats.regularUsers} color="bg-gray-500" />
            </div>

            {/* Statistics – Mobile: Accordion */}
            <Accordion type="single" collapsible className="w-full lg:hidden">
                <AccordionItem value="stats" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">User Statistics</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-1 gap-4">
                            <StatCard icon={Users} title="Total Users" value={stats.totalUsers} color="bg-blue-500" />
                            <StatCard icon={Shield} title="Administrators" value={stats.adminUsers} color="bg-purple-500" />
                            <StatCard icon={UserCircle} title="Regular Users" value={stats.regularUsers} color="bg-gray-500" />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Administrators</SelectItem>
                                <SelectItem value="user">Regular Users</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2 flex-1">
                            <Input
                                placeholder="Search by name, email, or ID..."
                                defaultValue={searchQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(e.currentTarget.value);
                                    }
                                }}
                                className="max-w-md"
                            />
                            <Button onClick={() => {
                                const input = document.querySelector('input[placeholder="Search by name, email, or ID..."]') as HTMLInputElement;
                                handleSearch(input?.value || "");
                            }}>Search</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table - Desktop */}
            <Card className="hidden lg:block">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Avatar</TableHead>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead className="w-[250px]">Email</TableHead>
                                <TableHead className="w-[120px]">Role</TableHead>
                                <TableHead className="w-[200px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u) => (
                                    <TableRow key={u.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <Avatar>
                                                <AvatarImage src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} />
                                                <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                                        <TableCell>
                                            <Badge className={getRoleColor(u.role?.name)}>
                                                {u.role?.name || 'No Role'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setRoleDialogOpen(true);
                                                    }}
                                                >
                                                    <UserCog className="h-4 w-4 mr-2" />
                                                    Change Role
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {pagination.totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
                        <div className="text-sm text-muted-foreground">
                            Showing {startItem} to {endItem} of {pagination.totalItems} results
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <div className="hidden sm:flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.currentPage - 2 + i;
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pagination.currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum)}
                                            className="min-w-[2.5rem]"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <div className="sm:hidden text-sm text-muted-foreground px-2">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Users Cards - Mobile/Tablet */}
            <div className="space-y-3 lg:hidden">
                {users.map((u) => (
                    <Card key={u.id} className="shadow-sm border-muted/50">
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <Avatar>
                                    <AvatarImage src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} />
                                    <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{u.name}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                                    <div className="mt-1">
                                        <Badge className={getRoleColor(u.role?.name)}>
                                            {u.role?.name || 'No Role'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => openEdit(u)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedUser(u);
                                        setRoleDialogOpen(true);
                                    }}
                                    className="flex-1"
                                >
                                    <UserCog className="h-4 w-4 mr-1" />
                                    Change Role
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Mobile Pagination */}
                {pagination.totalItems > 0 && (
                    <Card className="lg:hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            {/* Edit User Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="User name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="user@example.com"
                            />
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={saveEdit} disabled={isSaving}>
                            {isSaving ? <><Spinner className="mr-2" /> Saving...</> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/*  Assign Role Dialog */}
            <AssignRoleDialog
                user={selectedUser}
                open={roleDialogOpen}
                onOpenChange={setRoleDialogOpen}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}
