
import React, { useState, useEffect } from "react";
import { Tenant } from "@/types/tenant";
import { tenantService } from "@/services/tenant.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Plus, Building, Search, RefreshCw } from "lucide-react";
import { TenantDialog } from "./TenantDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function TenantsTable() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

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

                    <div className="rounded-md border">
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
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(tenant)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <TenantDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                tenant={editingTenant}
                onSuccess={loadTenants}
            />
        </div>
    );
}
