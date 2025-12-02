"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { usersService, rolesService } from "@/services";
import { ApiError } from "@/lib/api-client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCog } from "lucide-react";

import { Role } from "@/types/role.types";
import { User } from "@/types/user.types";

type AssignRoleDialogProps = {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
};

export function AssignRoleDialog({
    user,
    open,
    onOpenChange,
    onSuccess,
}: AssignRoleDialogProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(false);

    // Load roles when dialog opens
    useEffect(() => {
        if (open) {
            loadRoles();
        }
    }, [open]);

    const loadRoles = async () => {
        setLoadingRoles(true);
        try {
            const fetchedRoles = await rolesService.getAll();
            setRoles(fetchedRoles);
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : "Failed to load roles";
            toast.error(message);
        } finally {
            setLoadingRoles(false);
        }
    };

    // Helper function to refresh permissions cache
    const refreshPermissions = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/validate`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Permissions refreshed after role assignment:', data.data?.permissions);
            }
        } catch (err) {
            console.error('Failed to refresh permissions:', err);
        }
    };

    const handleAssign = async () => {
        if (!user || !selectedRoleId) {
            toast.error("Please select a role");
            return;
        }

        setLoading(true);
        try {
            await usersService.assignRole(user.id, selectedRoleId);
            toast.success(`Role assigned to ${user.name}`);

            // Refresh permissions cache in backend
            await refreshPermissions();

            setSelectedRoleId("");
            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : "Failed to assign role";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        Assign Role
                    </DialogTitle>
                    <DialogDescription>
                        {user && (
                            <>
                                Assign a role to <strong>{user.name}</strong> ({user.email})
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loadingRoles ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label
                                htmlFor="role-select"
                                className="text-sm font-medium"
                            >
                                Select Role
                            </label>
                            <Select
                                value={selectedRoleId}
                                onValueChange={setSelectedRoleId}
                            >
                                <SelectTrigger id="role-select">
                                    <SelectValue placeholder="Choose a role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No roles available
                                        </div>
                                    ) : (
                                        roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                <div>
                                                    <div className="font-medium">{role.name}</div>
                                                    {role.description && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {role.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={loading || !selectedRoleId || loadingRoles}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Role
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
