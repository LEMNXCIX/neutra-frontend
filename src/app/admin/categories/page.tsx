import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";
import { validateAdminAccess } from "@/lib/server-auth";
import { api } from '@/lib/api-client';

export const dynamic = "force-dynamic";

export default async function GlobalCategoriesPage({
    searchParams,
}: {
    searchParams: Promise<{ tenantId?: string }>;
}) {
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");

    const params = await searchParams;
    const query = new URLSearchParams(params);
    query.set("tenantId", query.get("tenantId") || "all");

    const result = await api.get<any>(`/categories?${query.toString()}`).catch(() => ({}));
    const categories = result?.categories || (Array.isArray(result) ? result : []);
    const stats = result?.stats || { totalCategories: 0, totalProducts: 0, averageProductsPerCategory: 0 };
    const pagination = result?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 };

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Global Categories
            </h2>
            <Suspense fallback={null}>
                <CategoriesTableClient
                    categories={categories}
                    stats={stats}
                    pagination={pagination}
                    isSuperAdmin={true}
                />
            </Suspense>
        </div>
    );
}
