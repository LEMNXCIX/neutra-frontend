import React, { Suspense } from "react";
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";
import { api } from '@/lib/api-client';

export const metadata = { title: "Booking Categories" };

export const dynamic = "force-dynamic";

async function getCategories(searchParams: { type?: string }) {
    try {
        const query = new URLSearchParams();
        const type = searchParams.type || "SERVICE";
        query.set("type", type);

        const data = await api.get<any>(`/categories?${query.toString()}`);
        const categories = data?.categories || (Array.isArray(data) ? data : []);

        // Stats from backend if available, otherwise calculate
        const backendStats = data.data?.stats || data.stats;
        const stats = backendStats || {
            totalCategories: categories.length,
            totalProducts: categories.reduce(
                (sum: number, c: any) =>
                    sum + (c.productCount || c._count?.products || 0),
                0,
            ),
            averageProductsPerCategory:
                categories.length > 0
                    ? Math.round(
                          categories.reduce(
                              (sum: number, c: any) =>
                                  sum +
                                  (c.productCount || c._count?.products || 0),
                              0,
                          ) / categories.length,
                      )
                    : 0,
        };

        return {
            categories,
            stats,
        };
    } catch (err) {
        console.error("Error fetching categories:", err);
        return {
            categories: [],
            stats: {
                totalCategories: 0,
                totalProducts: 0,
                averageProductsPerCategory: 0,
            },
        };
    }
}

export default async function BookingCategoriesPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string }>;
}) {
    const params = await searchParams;
    const data = await getCategories(params);

    return (
        <div className="p-6">
            <Suspense fallback={null}>
                <CategoriesTableClient
                    categories={data.categories}
                    stats={data.stats}
                    pagination={{
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: data.categories.length,
                        itemsPerPage: data.categories.length,
                    }}
                />
            </Suspense>
        </div>
    );
}
