"use client";

import React, {
    useReducer,
    useEffect,
    useCallback,
    useSyncExternalStore,
} from "react";
import { Tenant } from "@/types/tenant";
import { tenantService } from "@/services/tenant.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Edit,
    Trash2,
    Plus,
    Building,
    Search,
    RefreshCw,
    Settings,
} from "lucide-react";
import { TenantDialog } from "./TenantDialog";
import { TenantFeaturesDialog } from "./TenantFeaturesDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useConfirm } from "@/hooks/use-confirm";

const EMPTY_TENANTS: Tenant[] = [];
const EMPTY_PLATFORM_FEATURES: any[] = [];

function TenantBadge({ type }: { type: string }) {
    return (
        <Badge
            className={
                type === "STORE"
                    ? "bg-blue-500"
                    : type === "BOOKING"
                      ? "bg-purple-500"
                      : "bg-green-500"
            }
        >
            {type}
        </Badge>
    );
}

function TenantRow({
    tenant,
    onEdit,
    onDelete,
    onFeatures,
}: {
    tenant: Tenant;
    onEdit: (t: Tenant) => void;
    onDelete: (t: Tenant) => void;
    onFeatures: (t: Tenant) => void;
}) {
    return (
        <TableRow>
            <TableCell className="font-medium">{tenant.name}</TableCell>
            <TableCell>
                <Badge variant="outline">{tenant.slug}</Badge>
            </TableCell>
            <TableCell>
                <TenantBadge type={tenant.type} />
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
                {format(new Date(tenant.createdAt), "PP")}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onFeatures(tenant)}
                        title="Manage Features"
                    >
                        <Settings className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(tenant)}
                    >
                        <Edit className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(tenant)}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

function TenantCard({
    tenant,
    onEdit,
    onDelete,
    onFeatures,
}: {
    tenant: Tenant;
    onEdit: (t: Tenant) => void;
    onDelete: (t: Tenant) => void;
    onFeatures: (t: Tenant) => void;
}) {
    return (
        <Card className="border-2">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg">{tenant.name}</h3>
                        <Badge variant="outline" className="text-xs">
                            {tenant.slug}
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onFeatures(tenant)}
                            title="Manage Features"
                        >
                            <Settings className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(tenant)}
                        >
                            <Edit className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(tenant)}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <TenantBadge type={tenant.type} />
                </div>
                <div className="text-sm text-muted-foreground">
                    Created: {format(new Date(tenant.createdAt), "PP")}
                </div>
            </CardContent>
        </Card>
    );
}

type TenantsState = {
    tenants: Tenant[];
    loading: boolean;
    search: string;
    dialogOpen: boolean;
    editingTenant: Tenant | null;
    featuresDialogOpen: boolean;
    managingFeaturesTenant: Tenant | null;
};

type TenantsAction =
    | { type: "SET_TENANTS"; payload: Tenant[] }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_SEARCH"; payload: string }
    | { type: "SET_DIALOG_OPEN"; payload: boolean }
    | { type: "SET_EDITING_TENANT"; payload: Tenant | null }
    | { type: "SET_FEATURES_DIALOG_OPEN"; payload: boolean }
    | { type: "SET_MANAGING_FEATURES_TENANT"; payload: Tenant | null };

function tenantsReducer(
    state: TenantsState,
    action: TenantsAction,
): TenantsState {
    switch (action.type) {
        case "SET_TENANTS":
            return { ...state, tenants: action.payload };
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_SEARCH":
            return { ...state, search: action.payload };
        case "SET_DIALOG_OPEN":
            return { ...state, dialogOpen: action.payload };
        case "SET_EDITING_TENANT":
            return { ...state, editingTenant: action.payload };
        case "SET_FEATURES_DIALOG_OPEN":
            return { ...state, featuresDialogOpen: action.payload };
        case "SET_MANAGING_FEATURES_TENANT":
            return { ...state, managingFeaturesTenant: action.payload };
        default:
            return state;
    }
}

interface TenantsTableProps {
    initialTenants?: Tenant[];
    initialPlatformFeatures?: any[];
}

const emptySubscribe = () => () => {};

export function TenantsTable({
    initialTenants = EMPTY_TENANTS,
    initialPlatformFeatures = EMPTY_PLATFORM_FEATURES,
}: TenantsTableProps) {
    const isMounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
    const [state, dispatch] = useReducer(tenantsReducer, {
        tenants: initialTenants,
        loading: initialTenants.length === 0,
        search: "",
        dialogOpen: false,
        editingTenant: null,
        featuresDialogOpen: false,
        managingFeaturesTenant: null,
    });
    const { confirm, ConfirmDialog } = useConfirm();

    const loadTenants = useCallback(async () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
            const data = await tenantService.getAll();
            dispatch({ type: "SET_TENANTS", payload: data });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load tenants");
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    }, []);

    useEffect(() => {
        loadTenants();
    }, [loadTenants]);

    const filteredTenants = state.tenants.filter(
        (t) =>
            t.name.toLowerCase().includes(state.search.toLowerCase()) ||
            t.slug.toLowerCase().includes(state.search.toLowerCase()),
    );

    const openCreate = () => {
        dispatch({ type: "SET_EDITING_TENANT", payload: null });
        dispatch({ type: "SET_DIALOG_OPEN", payload: true });
    };

    const openEdit = (tenant: Tenant) => {
        dispatch({ type: "SET_EDITING_TENANT", payload: tenant });
        dispatch({ type: "SET_DIALOG_OPEN", payload: true });
    };

    const openFeatures = (tenant: Tenant) => {
        dispatch({ type: "SET_MANAGING_FEATURES_TENANT", payload: tenant });
        dispatch({ type: "SET_FEATURES_DIALOG_OPEN", payload: true });
    };

    const handleDelete = async (tenant: Tenant) => {
        const confirmed = await confirm({
            title: "Delete Tenant",
            description: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone and will remove all data associated with this tenant.`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });

        if (!confirmed) return;

        try {
            await tenantService.delete(tenant.id);
            toast.success(`Tenant "${tenant.name}" deleted successfully`);
            loadTenants();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete tenant");
        }
    };

    if (!isMounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium flex items-center gap-2">
                    <Building className="size-5" />
                    Tenants
                </h2>
                <Button onClick={openCreate}>
                    <Plus className="size-4 mr-2" />
                    New Tenant
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tenants..."
                                className="pl-9"
                                value={state.search}
                                onChange={(e) =>
                                    dispatch({
                                        type: "SET_SEARCH",
                                        payload: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadTenants}
                        >
                            <RefreshCw
                                className={`size-4 ${state.loading ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {state.loading && state.tenants.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-8"
                                        >
                                            Loading…
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTenants.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            No tenants found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTenants.map((tenant) => (
                                        <TenantRow
                                            key={tenant.id}
                                            tenant={tenant}
                                            onEdit={openEdit}
                                            onDelete={handleDelete}
                                            onFeatures={openFeatures}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {state.loading && state.tenants.length === 0 ? (
                            <div className="text-center py-8">Loading…</div>
                        ) : filteredTenants.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No tenants found
                            </div>
                        ) : (
                            filteredTenants.map((tenant) => (
                                <TenantCard
                                    key={tenant.id}
                                    tenant={tenant}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onFeatures={openFeatures}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <TenantDialog
                open={state.dialogOpen}
                onOpenChange={(open) =>
                    dispatch({ type: "SET_DIALOG_OPEN", payload: open })
                }
                tenant={state.editingTenant}
                onSuccess={loadTenants}
                initialPlatformFeatures={initialPlatformFeatures}
            />

            {state.managingFeaturesTenant && (
                <TenantFeaturesDialog
                    open={state.featuresDialogOpen}
                    onOpenChange={(open) =>
                        dispatch({
                            type: "SET_FEATURES_DIALOG_OPEN",
                            payload: open,
                        })
                    }
                    tenantId={state.managingFeaturesTenant.id}
                    tenantName={state.managingFeaturesTenant.name}
                />
            )}

            <ConfirmDialog />
        </div>
    );
}
