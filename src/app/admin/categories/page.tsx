import React from "react";
import { categoriesService } from "@/services";
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";

async function getCategories() {
    try {
        // Use categoriesService which uses apiClient
        const categories = await categoriesService.getAll();

        // Calculate stats
        const totalCategories = categories.length;

        // Count products per category (if available)
        const totalProducts = categories.reduce((sum: number, c: any) => {
            return sum + (c.products?.length || 0);
        }, 0);

        const averageProductsPerCategory = totalCategories > 0
            ? Math.round(totalProducts / totalCategories)
            : 0;

        const withProducts = categories.filter((c: any) =>
            c.products && c.products.length > 0
        ).length;

        return {
            categories,
            stats: {
                totalCategories,
                totalProducts,
                averageProductsPerCategory,
                withProducts,
            },
        };
    } catch (err) {
        console.error("Error fetching categories:", err);
        return {
            categories: [],
            stats: {
                totalCategories: 0,
                totalProducts: 0,
                averageProductsPerCategory: 0,
                withProducts: 0,
            },
        };
    }
}

export default async function CategoriesPage() {
    const data = await getCategories();

    return (
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
    );
}
