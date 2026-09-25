"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Edit, Trash2 } from "lucide-react";

type AdminCardActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

export function AdminCardActions({ onEdit, onDelete, isDeleting }: AdminCardActionsProps) {
  return (
    <div className="flex gap-2 pt-2 border-t">
      <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
        <Edit className="size-4 mr-2" />
        Editar
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? <Spinner className="size-4 mr-2" /> : <Trash2 className="size-4 mr-2" />}
        Eliminar
      </Button>
    </div>
  );
}
