"use client";

import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Column = { label: string; className?: string };

type AdminTableHeaderProps = {
  columns: Column[];
  actionLabel?: string;
};

export function AdminTableHeader({ columns, actionLabel = "Actions" }: AdminTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column.label} className={column.className}>
            {column.label}
          </TableHead>
        ))}
        <TableHead className="text-right">{actionLabel}</TableHead>
      </TableRow>
    </TableHeader>
  );
}
