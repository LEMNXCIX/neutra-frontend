"use client";

import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/admin/shared/FilterSelect";
import { Plus } from "lucide-react";

type AdminEntityHeaderProps = {
  title: string;
  description: string;
  createLabel: string;
  isSuperAdmin: boolean;
  tenantFilter: string;
  onTenantFilterChange: (value: string) => void;
  onCreate: () => void;
};

export function AdminEntityHeader({
  title,
  description,
  createLabel,
  isSuperAdmin,
  tenantFilter,
  onTenantFilterChange,
  onCreate,
}: AdminEntityHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {isSuperAdmin && (
          <FilterSelect
            value={tenantFilter}
            onValueChange={onTenantFilterChange}
            placeholder="Todos los tenants"
            triggerClassName="w-full sm:w-[180px]"
            options={[{ value: "all", label: "Todos los tenants" }]}
          />
        )}
        <Button onClick={onCreate} className="w-full sm:w-auto">
          <Plus className="size-4 mr-2" />
          {createLabel}
        </Button>
      </div>
    </div>
  );
}
