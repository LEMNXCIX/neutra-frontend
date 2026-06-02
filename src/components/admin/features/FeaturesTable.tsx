"use client";

import React, { useReducer, useEffect, useCallback } from "react";
import { PlatformFeature, featuresService } from "@/services/features.service";
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
    Zap,
    Search,
    RefreshCw,
    DollarSign,
} from "lucide-react";
import { FeatureDialog } from "./FeatureDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const EMPTY_FEATURES: PlatformFeature[] = [];

type FeaturesState = {
  features: PlatformFeature[];
  loading: boolean;
  search: string;
  dialogOpen: boolean;
  editingFeature: PlatformFeature | null;
};

type FeaturesAction =
  | { type: "SET_FEATURES"; payload: PlatformFeature[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_EDITING_FEATURE"; payload: PlatformFeature | null };

function featuresReducer(state: FeaturesState, action: FeaturesAction): FeaturesState {
  switch (action.type) {
    case "SET_FEATURES":
      return { ...state, features: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "SET_DIALOG_OPEN":
      return { ...state, dialogOpen: action.payload };
    case "SET_EDITING_FEATURE":
      return { ...state, editingFeature: action.payload };
    default:
      return state;
  }
}

interface FeaturesTableProps {
  initialFeatures?: PlatformFeature[];
}

export function FeaturesTable({ initialFeatures = EMPTY_FEATURES }: FeaturesTableProps) {
  const [state, dispatch] = useReducer(featuresReducer, {
    features: initialFeatures,
    loading: initialFeatures.length === 0,
    search: "",
    dialogOpen: false,
    editingFeature: null,
  });

  const loadFeatures = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
      try {
      const data = await featuresService.getAll();
      dispatch({ type: "SET_FEATURES", payload: data });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load features");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

    const handleDelete = async (id: string) => {
        if (
            !confirm(
                "Are you sure you want to delete this feature? This might affect tenants using it.",
            )
        )
            return;

        try {
            await featuresService.delete(id);
            toast.success("Feature deleted");
            loadFeatures();
        } catch (error) {
            toast.error("Failed to delete feature");
        }
    };

  const filteredFeatures = state.features.filter(
    (f) =>
      f.name.toLowerCase().includes(state.search.toLowerCase()) ||
      f.key.toLowerCase().includes(state.search.toLowerCase()) ||
      f.category?.toLowerCase().includes(state.search.toLowerCase()),
    );

    const openCreate = () => {
    dispatch({ type: "SET_EDITING_FEATURE", payload: null });
    dispatch({ type: "SET_DIALOG_OPEN", payload: true });
    };

    const openEdit = (feature: PlatformFeature) => {
    dispatch({ type: "SET_EDITING_FEATURE", payload: feature });
    dispatch({ type: "SET_DIALOG_OPEN", payload: true });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium flex items-center gap-2">
                    <Zap className="size-5 text-yellow-500" />
                    Platform Features
                </h2>
                <Button onClick={openCreate}>
                    <Plus className="size-4 mr-2" />
                    New Feature
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search features..."
                                className="pl-9"
      value={state.search}
          onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadFeatures}
                        >
                            <RefreshCw
                                className={`size-4 ${state.loading ? "animate-spin" : ""}`}
                            />
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
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {state.loading && state.features.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-8"
                                        >
                                            Loading…
                                        </TableCell>
                                    </TableRow>
                                ) : filteredFeatures.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            No features found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFeatures.map((feature) => (
                                        <TableRow key={feature.id}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {feature.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {feature.description}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-mono text-[10px]"
                                                >
                                                    {feature.key}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {feature.category ? (
                                                    <Badge variant="outline">
                                                        {feature.category}
                                                    </Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 font-bold text-green-600">
                                                    <DollarSign className="size-3" />
                                                    {feature.price.toFixed(2)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEdit(feature)
                                                        }
                                                    >
                                                        <Edit className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            handleDelete(
                                                                feature.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
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
open={state.dialogOpen}
        onOpenChange={(open) => dispatch({ type: "SET_DIALOG_OPEN", payload: open })}
        feature={state.editingFeature}
                onSuccess={loadFeatures}
            />
        </div>
    );
}
