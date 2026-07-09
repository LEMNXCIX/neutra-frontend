import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import ProductsTableClient from "@/components/admin/products/ProductsTableClient";
import { validateAdminAccess } from "@/lib/server-auth";
import { api } from '@/lib/api-client';

export const dynamic = "force-dynamic";

export default async function GlobalProductsPage({
    searchParams,
}: {
    searchParams: any;
}) {
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    const query = new URLSearchParams(params);
    query.set("tenantId", query.get("tenantId") || "all");

    const [productsData, categoriesData] = await Promise.all([
        api.get<any>(`/products?${query.toString()}`).catch(() => ({})),
        api.get<any>(`/categories?tenantId=all`).catch(() => ({})),
    ]);

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Global Products
            </h2>
            <Suspense fallback={null}>
                <ProductsTableClient
                    products={productsData?.products || (Array.isArray(productsData) ? productsData : [])}
                    stats={
                        productsData?.stats || {
                            totalProducts: 0,
                            totalValue: 0,
                            lowStockCount: 0,
                        }
                    }
                    pagination={
                        productsData?.pagination || {
                            currentPage: 1,
                            totalPages: 1,
                            totalItems: 0,
                            itemsPerPage: 10,
                        }
                    }
                    categories={
                        categoriesData?.categories ||
                        (Array.isArray(categoriesData) ? categoriesData : [])
                    }
                    isSuperAdmin={true}
                />
            </Suspense>
        </div>
    );
}
