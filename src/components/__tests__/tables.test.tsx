// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAdminTable } from "@/components/admin/shared/useAdminTable";

type Product = { id: string; name: string; price: number };

// Deliberately unordered so sorting cannot be a no-op.
const PRODUCTS: Product[] = [
    { id: "p01", name: "Zebra", price: 10 },
    { id: "p02", name: "Alpha", price: 90 },
    { id: "p03", name: "Mango", price: 20 },
    { id: "p04", name: "Beta", price: 80 },
    { id: "p05", name: "Yoyo", price: 30 },
    { id: "p06", name: "Gamma", price: 70 },
    { id: "p07", name: "Xray", price: 40 },
    { id: "p08", name: "Delta", price: 60 },
    { id: "p09", name: "Waves", price: 50 },
    { id: "p10", name: "Epsilon", price: 55 },
    { id: "p11", name: "Vega", price: 15 },
    { id: "p12", name: "Eta", price: 65 },
    { id: "p13", name: "Uma", price: 25 },
    { id: "p14", name: "Theta", price: 75 },
    { id: "p15", name: "Tango", price: 35 },
    { id: "p16", name: "Iota", price: 85 },
    { id: "p17", name: "Sigma", price: 5 },
    { id: "p18", name: "Kappa", price: 95 },
    { id: "p19", name: "Rho", price: 45 },
    { id: "p20", name: "Lambda", price: 12 },
];

const columns = [
    { id: "name", accessorKey: "name" },
    { id: "price", accessorKey: "price" },
];

function pageIds(table: {
    getPaginatedRowModel: () => { rows: Array<{ id: string }> };
}) {
    return table.getPaginatedRowModel().rows.map((row) => row.id);
}

describe("useAdminTable (headless admin tables)", () => {
    it("keeps source order and stable row ids with the core row model only", () => {
        const { result } = renderHook(() =>
            useAdminTable({
                data: PRODUCTS,
                columns,
                getRowId: (product) => product.id,
            }),
        );

        expect(result.current.rows.map((row) => row.id)).toEqual(
            PRODUCTS.map((product) => product.id),
        );
        expect(
            result.current.table.getCoreRowModel().rows.map((row) => row.id),
        ).toEqual(PRODUCTS.map((product) => product.id));
    });

    it("sorts a column programmatically and keeps the sorted row ids", () => {
        const { result } = renderHook(() =>
            useAdminTable({
                data: PRODUCTS,
                columns,
                getRowId: (product) => product.id,
                enableSorting: true,
            }),
        );

        act(() => {
            result.current.table.getColumn("name")?.toggleSorting(false);
        });

        const expected = [...PRODUCTS]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((product) => product.id);
        expect(
            result.current.table.getSortedRowModel().rows.map((row) => row.id),
        ).toEqual(expected);
    });

    it("sorting a column and changing page yields the same row ids as before", () => {
        const { result } = renderHook(() =>
            useAdminTable({
                data: PRODUCTS,
                columns,
                getRowId: (product) => product.id,
                enableSorting: true,
                enablePagination: true,
                pageSize: 5,
            }),
        );

        // Page 1 before sorting (parity with the previous manual slice).
        expect(pageIds(result.current.table)).toEqual([
            "p01",
            "p02",
            "p03",
            "p04",
            "p05",
        ]);

        act(() => {
            result.current.table.getColumn("name")?.toggleSorting(false);
        });

        const sortedIds = [...PRODUCTS]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((product) => product.id);
        expect(pageIds(result.current.table)).toEqual(sortedIds.slice(0, 5));

        act(() => {
            result.current.table.nextPage();
        });

        // Same row ids as sorting the source array and slicing page 2.
        expect(pageIds(result.current.table)).toEqual(sortedIds.slice(5, 10));
        expect(result.current.rows.map((row) => row.id)).toEqual(
            sortedIds.slice(5, 10),
        );
    });

    it("exposes pagination info shaped for the existing TablePagination UI", () => {
        const { result } = renderHook(() =>
            useAdminTable({
                data: PRODUCTS,
                columns,
                getRowId: (product) => product.id,
                enablePagination: true,
                pageSize: 5,
            }),
        );

        expect(result.current.adminPagination).toEqual({
            currentPage: 1,
            totalPages: 4,
            totalItems: 20,
            itemsPerPage: 5,
        });
    });

    it("passes every server row through with the production Infinity page size", () => {
        const serverPage = Array.from({ length: 500 }, (_, index) => ({
            id: `row-${index}`,
            name: `Producto ${index}`,
            price: index,
        }));
        const { result } = renderHook(() =>
            useAdminTable({
                data: serverPage,
                columns,
                getRowId: (product) => product.id,
                enablePagination: true,
            }),
        );

        expect(result.current.rows).toHaveLength(500);
        expect(result.current.rows.map((row) => row.id)).toEqual(
            serverPage.map((row) => row.id),
        );
        expect(result.current.adminPagination.totalItems).toBe(500);
        expect(result.current.adminPagination.totalPages).toBe(1);
    });
});

describe("admin table migration coverage", () => {
    const migratedTables = [
        "admin/appointments/AppointmentsTableClient.tsx",
        "admin/appointments/AttentionQueue.tsx",
        "admin/banners/BannersTableClient.tsx",
        "admin/booking/ServicesTableClient.tsx",
        "admin/booking/StaffTableClient.tsx",
        "admin/categories/CategoriesTableClient.tsx",
        "admin/coupons/CouponsTableClient.tsx",
        "admin/features/FeaturesTable.tsx",
        "admin/logs/logs-client.tsx",
        "admin/loyalty/SuperAdminLoyaltyClient.tsx",
        "admin/loyalty/TenantLoyaltyClient.tsx",
        "admin/orders/OrdersTableClient.tsx",
        "admin/products/ProductsTableClient.tsx",
        "admin/roles/RolesTableClient.tsx",
        "admin/sliders/SlidersTableClient.tsx",
        "admin/tenants/TenantsTable.tsx",
        "admin/users/UsersTableClient.tsx",
    ];

    it("every migrated admin table derives rows from useAdminTable", () => {
        for (const relativePath of migratedTables) {
            const source = readFileSync(
                resolve(process.cwd(), "src/components", relativePath),
                "utf8",
            );
            expect(source, relativePath).toMatch(/useAdminTable\s*\(/);
        }
    });
});
