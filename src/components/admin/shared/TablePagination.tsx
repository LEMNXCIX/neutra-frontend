"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};

type TablePaginationProps = {
  pagination: Pagination;
  onPageChange: (page: number) => void;
};

export function TablePagination({ pagination, onPageChange }: TablePaginationProps) {
  if (pagination.totalItems <= 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
      <div className="text-sm text-muted-foreground">
        Mostrando {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} a{" "}
        {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} resultados
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
        >
          <ChevronLeft className="size-4 mr-1" />
          Anterior
        </Button>
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-sm text-muted-foreground px-2">
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
        >
          Siguiente
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export function MobileTablePagination({ pagination, onPageChange }: TablePaginationProps) {
  if (pagination.totalItems <= 0) return null;

  return (
    <Card className="lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {pagination.currentPage} de {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
