"use client";

/**
 * Shared headless table primitive for the admin screens.
 *
 * TanStack Table owns the row models (core / sorted / paginated) and the
 * sorting + pagination state. The application keeps owning every piece of
 * semantic markup, styling and Spanish labels, so migrating a screen never
 * changes what a user sees. Screens without pagination read the core row model
 * only; no pagination UI is invented for them.
 */
import {
    type ColumnDef,
    createPaginatedRowModel,
    createSortedRowModel,
    type PaginationState,
    type RowData,
    rowPaginationFeature,
    rowSortingFeature,
    type SortingState,
    tableFeatures,
    useTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

const adminTableFeatures = tableFeatures({
    rowSortingFeature,
    rowPaginationFeature,
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
});

type AdminFeatures = typeof adminTableFeatures;

const defaultColumns = [{ id: "id", accessorKey: "id" }] as ColumnDef<
    AdminFeatures,
    RowData
>[];

export type AdminTableColumn<TData extends RowData> = ColumnDef<
    AdminFeatures,
    TData
>;

export type AdminTablePagination = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
};

export type UseAdminTableOptions<TData extends RowData> = {
    /** Server-fetched rows (a page's worth for server-paginated screens). */
    data: TData[];
    /** Optional column definitions; a stable id column is used by default. */
    columns?: AdminTableColumn<TData>[];
    getRowId?: (row: TData, index: number) => string;
    /** Enables the sorted row model (sorting is applied programmatically). */
    enableSorting?: boolean;
    /** Enables the paginated row model. */
    enablePagination?: boolean;
    /** Page size for client pagination. Infinity keeps every supplied row. */
    pageSize?: number;
    initialPageIndex?: number;
};

export function useAdminTable<TData extends RowData>({
    data,
    columns,
    getRowId,
    enableSorting = false,
    enablePagination = false,
    pageSize = Number.POSITIVE_INFINITY,
    initialPageIndex = 0,
}: UseAdminTableOptions<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: initialPageIndex,
        pageSize,
    });

    const resolvedColumns = useMemo(
        () => columns ?? (defaultColumns as AdminTableColumn<TData>[]),
        [columns],
    );
    const resolvedGetRowId = useMemo(
        () =>
            getRowId ??
            ((row: TData, index: number) =>
                String((row as { id?: string }).id ?? index)),
        [getRowId],
    );

    const table = useTable({
        features: adminTableFeatures,
        data,
        columns: resolvedColumns,
        getRowId: resolvedGetRowId,
        state: { sorting, pagination },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
    });

    // Non-paginated screens explicitly read the core row model. Sorted and
    // paginated models are only stepped through when the screen opts in.
    const rowModel = enablePagination
        ? table.getPaginatedRowModel()
        : enableSorting
          ? table.getSortedRowModel()
          : table.getCoreRowModel();

    const rows = rowModel.rows.map((row) => row.original);
    const rowCount = (
        enablePagination
            ? table.getPrePaginatedRowModel()
            : table.getCoreRowModel()
    ).rows.length;
    const itemsPerPage = pagination.pageSize;
    const adminPagination: AdminTablePagination = {
        currentPage: pagination.pageIndex + 1,
        totalPages:
            itemsPerPage === Number.POSITIVE_INFINITY
                ? rowCount > 0
                    ? 1
                    : 0
                : Math.ceil(rowCount / itemsPerPage),
        totalItems: rowCount,
        itemsPerPage,
    };

    return { table, rows, rowModel, sorting, pagination, adminPagination };
}
