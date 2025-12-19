"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Mail, Phone, Info, User as UserIcon } from "lucide-react";
import { bookingService, Staff } from "@/services/booking.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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

export default function StaffTableClient() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const { confirm, ConfirmDialog } = useConfirm();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        active: true
    });

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getStaff(false);
            setStaff(data);
        } catch (err) {
            console.error('Error loading staff:', err);
            toast.error("Failed to load staff members");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingStaff(null);
        setFormData({ name: '', email: '', phone: '', bio: '', active: true });
        setDialogOpen(true);
    };

    const openEdit = (member: Staff) => {
        setEditingStaff(member);
        setFormData({
            name: member.name,
            email: member.email || '',
            phone: member.phone || '',
            bio: member.bio || '',
            active: member.active
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff';
            const method = editingStaff ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(`Staff member ${editingStaff ? 'updated' : 'added'} successfully`);
                setDialogOpen(false);
                await loadStaff();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || `Failed to ${editingStaff ? 'update' : 'add'} staff member`);
            }
        } catch (err) {
            console.error(`Error ${editingStaff ? 'updating' : 'creating'} staff:`, err);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Staff Member",
            description: "Are you sure you want to remove this staff member? This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive"
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/staff/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success("Staff member removed successfully");
                await loadStaff();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to remove staff member");
            }
        } catch (err) {
            console.error('Error deleting staff:', err);
            toast.error("An unexpected error occurred");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Spinner className="h-8 w-8 text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading staff members...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ConfirmDialog />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Professional staff members available for bookings.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                </Button>
            </div>

            {staff.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="bg-muted rounded-full p-4 mb-4">
                        <UserIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle>No staff members found</CardTitle>
                    <CardDescription className="max-w-[400px] mt-2">
                        Add your first staff member to start managing appointments and services.
                    </CardDescription>
                    <Button variant="outline" className="mt-6" onClick={openCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff Member
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((member) => (
                        <Card key={member.id} className="overflow-hidden group hover:border-primary/50 transition-all active:scale-[0.98]">
                            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                                <Avatar className="h-14 w-14 border-2 border-background group-hover:border-primary/20 transition-colors">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="text-lg truncate">{member.name}</CardTitle>
                                        <Badge variant={member.active ? "default" : "secondary"} className="shrink-0">
                                            {member.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-1">Staff Member</CardDescription>
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
                                            <Mail className="h-4 w-4 mr-2 opacity-70" />
                                            <span className="truncate">{member.email}</span>
                                        </div>
                                    )}
                                    {member.phone && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4 mr-2 opacity-70" />
                                            <span>{member.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 pt-4 flex justify-between">
                                <Button variant="ghost" size="sm" className="hover:bg-background" onClick={() => openEdit(member)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(member.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={(open) => {
                if (!isSaving) setDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingStaff ? 'Edit Staff Profile' : 'Add Staff Member'}</DialogTitle>
                        <DialogDescription>
                            {editingStaff ? 'Update professional information for this team member.' : 'Create a new professional profile for your team.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="jane@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Professional Bio</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Briefly describe their expertise..."
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                            <div className="space-y-0.5">
                                <Label htmlFor="active" className="text-sm font-medium">Active Status</Label>
                                <p className="text-xs text-muted-foreground">
                                    Enable bookings for this member
                                </p>
                            </div>
                            <Switch
                                id="active"
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : editingStaff ? "Update Profile" : "Add Staff Member"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
