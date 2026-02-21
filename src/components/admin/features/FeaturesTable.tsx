"use client";

import React, { useState, useEffect } from "react";
import { PlatformFeature, featuresService } from "@/services/features.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Plus, Zap, Search, RefreshCw, DollarSign } from "lucide-react";
import { FeatureDialog } from "./FeatureDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface FeaturesTableProps {
    initialFeatures?: PlatformFeature[];
}

export function FeaturesTable({ initialFeatures = [] }: FeaturesTableProps) {
    const [features, setFeatures] = useState<PlatformFeature[]>(initialFeatures);
    const [loading, setLoading] = useState(initialFeatures.length === 0);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<PlatformFeature | null>(null);

    const loadFeatures = async () => {
        setLoading(true);
        try {
            const data = await featuresService.getAll();
            setFeatures(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load features");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeatures();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this feature? This might affect tenants using it.")) return;

        try {
            await featuresService.delete(id);
            toast.success("Feature deleted");
            loadFeatures();
        } catch (error) {
            toast.error("Failed to delete feature");
        }
    };

    const filteredFeatures = features.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.key.toLowerCase().includes(search.toLowerCase()) ||
        f.category?.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setEditingFeature(null);
        setDialogOpen(true);
    };

    const openEdit = (feature: PlatformFeature) => {
        setEditingFeature(feature);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Platform Features
                </h2>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Feature
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search features..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={loadFeatures}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Key</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && features.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredFeatures.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No features found</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFeatures.map((feature) => (
                                        <TableRow key={feature.id}>
                                            <TableCell>
                                                <div className="font-medium">{feature.name}</div>
                                                <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {feature.description}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono text-[10px]">
                                                    {feature.key}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {feature.category ? (
                                                    <Badge variant="outline">{feature.category}</Badge>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 font-bold text-green-600">
                                                    <DollarSign className="h-3 w-3" />
                                                    {feature.price.toFixed(2)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(feature)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(feature.id)}>
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
                </CardContent>
            </Card>

            <FeatureDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                feature={editingFeature}
                onSuccess={loadFeatures}
            />
        </div>
    );
}
