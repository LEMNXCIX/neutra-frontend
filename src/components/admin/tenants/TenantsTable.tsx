
import React, { useState, useEffect } from "react";
import { Tenant } from "@/types/tenant";
import { tenantService } from "@/services/tenant.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Plus, Building, Search, RefreshCw, Settings } from "lucide-react";
import { TenantDialog } from "./TenantDialog";
import { TenantFeaturesDialog } from "./TenantFeaturesDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useConfirm } from "@/hooks/use-confirm";

interface TenantsTableProps {
    initialTenants?: Tenant[];
}

export function TenantsTable({ initialTenants = [] }: TenantsTableProps) {
    const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
    const [loading, setLoading] = useState(initialTenants.length === 0);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [featuresDialogOpen, setFeaturesDialogOpen] = useState(false);
    const [managingFeaturesTenant, setManagingFeaturesTenant] = useState<Tenant | null>(null);
    const { confirm, ConfirmDialog } = useConfirm();

    const loadTenants = async () => {
        setLoading(true);
        try {
            const data = await tenantService.getAll();
            setTenants(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load tenants");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenants();
    }, []);

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setEditingTenant(null);
        setDialogOpen(true);
    };

    const openEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setDialogOpen(true);
    };

    const openFeatures = (tenant: Tenant) => {
        setManagingFeaturesTenant(tenant);
        setFeaturesDialogOpen(true);
    };

    const handleDelete = async (tenant: Tenant) => {
        const confirmed = await confirm({
            title: "Delete Tenant",
            description: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone and will remove all data associated with this tenant.`,
            confirmText: "Delete",
            cancelText: "Cancel"
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Tenants
                </h2>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Tenant
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tenants..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={loadTenants}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && tenants.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredTenants.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tenants found</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTenants.map((tenant) => (
                                        <TableRow key={tenant.id}>
                                            <TableCell className="font-medium">{tenant.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{tenant.slug}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    tenant.type === 'STORE' ? 'bg-blue-500' :
                                                        tenant.type === 'BOOKING' ? 'bg-purple-500' : 'bg-green-500'
                                                }>
                                                    {tenant.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(tenant.createdAt), 'PP')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openFeatures(tenant)}
                                                        title="Manage Features"
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(tenant)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(tenant)}
                                                        className="text-destructive hover:text-destructive"
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

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {loading && tenants.length === 0 ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : filteredTenants.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No tenants found</div>
                        ) : (
                            filteredTenants.map((tenant) => (
                                <Card key={tenant.id} className="border-2">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg">{tenant.name}</h3>
                                                <Badge variant="outline" className="text-xs">{tenant.slug}</Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openFeatures(tenant)}
                                                    title="Manage Features"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(tenant)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(tenant)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Type:</span>
                                            <Badge className={
                                                tenant.type === 'STORE' ? 'bg-blue-500' :
                                                    tenant.type === 'BOOKING' ? 'bg-purple-500' : 'bg-green-500'
                                            }>
                                                {tenant.type}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Created: {format(new Date(tenant.createdAt), 'PP')}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <TenantDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                tenant={editingTenant}
                onSuccess={loadTenants}
            />

            {managingFeaturesTenant && (
                <TenantFeaturesDialog
                    open={featuresDialogOpen}
                    onOpenChange={setFeaturesDialogOpen}
                    tenantId={managingFeaturesTenant.id}
                    tenantName={managingFeaturesTenant.name}
                />
            )}

            <ConfirmDialog />
        </div>
    );
}
