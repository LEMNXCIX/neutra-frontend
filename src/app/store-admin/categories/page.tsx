import React, { Suspense } from "react";
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";
import {
    extractTokenFromCookies,
    validateAdminAccess,
} from "@/lib/server-auth";
import { get as backendGet } from "../../../lib/backend-api";

export const metadata = { title: "Categories" };

export const dynamic = "force-dynamic";

async function getCategories(searchParams: { type?: string }) {
    try {
        const token = await extractTokenFromCookies();

        // Build query from searchParams
        const query = new URLSearchParams();
        if (searchParams.type) query.set("type", searchParams.type);

        const endpoint = query.toString()
            ? `/categories?${query.toString()}`
            : "/categories";
        const result = await backendGet(
            endpoint,
            token as string | undefined,
        );

        if (!result.success) {
            console.error(
                "Failed to fetch categories from backend:",
                result.error,
            );
            return {
                categories: [],
                stats: {
                    totalCategories: 0,
                    activeCategories: 0,
                    inactiveCategories: 0,
                    withImages: 0,
                    totalProducts: 0,
                    averageProductsPerCategory: 0,
                    withProducts: 0,
                },
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: 10,
                },
            };
        }

        const data = result as any;
        const categories =
            data.data?.categories ||
            data.categories ||
            (Array.isArray(data) ? data : []);

        // Calculate stats
        const backendStats = data.data?.stats || data.stats;
        const totalCategories = categories.length;
        const activeCategories = categories.filter((c: any) => c.active).length;
        const withImages = categories.filter(
            (c: any) => c.image || c.img,
        ).length;

        // Use backend stats if available, otherwise calculate
        const totalProducts =
            backendStats?.totalProducts ??
            categories.reduce(
                (sum: number, c: any) =>
                    sum + (c.productCount || c._count?.products || 0),
                0,
            );
        const averageProductsPerCategory =
            backendStats?.avgProductsPerCategory ??
            (totalCategories > 0
                ? Math.round(totalProducts / totalCategories)
                : 0);
        const withProducts = categories.filter(
            (c: any) => (c.productCount || c._count?.products || 0) > 0,
        ).length;

        const pagination = data.data?.pagination ||
            data.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalItems: totalCategories,
                itemsPerPage: totalCategories > 0 ? totalCategories : 10,
            };

        return {
            categories,
            stats: {
                totalCategories,
                activeCategories,
                inactiveCategories: totalCategories - activeCategories,
                withImages,
                totalProducts,
                averageProductsPerCategory,
                withProducts,
            },
            pagination,
        };
    } catch (err) {
        console.error("Error fetching categories:", err);
        return {
            categories: [],
            stats: {
                totalCategories: 0,
                activeCategories: 0,
                inactiveCategories: 0,
                withImages: 0,
                totalProducts: 0,
                averageProductsPerCategory: 0,
                withProducts: 0,
            },
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: 10,
            },
        };
    }
}

export default async function CategoriesPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string }>;
}) {
    const params = await searchParams;
    const data = await getCategories(params);

    return (
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
    );
}
