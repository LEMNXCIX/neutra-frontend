import React from "react";
import fs from "fs";
import path from "path";
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";

const CATEGORIES_PATH = path.join(process.cwd(), "src", "data", "categories.json");
const PRODUCTS_PATH = path.join(process.cwd(), "src", "data", "products.json");

type Category = {
    id: string;
    name: string;
    description?: string;
    productCount?: number;
};

type Product = {
    id: string;
    category?: string;
};

async function getCategories(search: string, page: number, limit: number) {
    try {
        const rawCategories = fs.readFileSync(CATEGORIES_PATH, "utf-8");
        const categoriesData = JSON.parse(rawCategories);
        let categories = (Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || []) as Category[];

        // Calculate product counts
        let products: Product[] = [];
        try {
            const rawProducts = fs.readFileSync(PRODUCTS_PATH, "utf-8");
            products = JSON.parse(rawProducts) as Product[];
        } catch { }

        const counts: Record<string, number> = {};
        products.forEach((p) => {
            if (p.category) {
                counts[p.category] = (counts[p.category] || 0) + 1;
            }
        });

        categories = categories.map((c) => ({
            ...c,
            productCount: counts[c.id] || 0,
        }));

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            categories = categories.filter(
                (c) =>
                    c.name.toLowerCase().includes(query) ||
                    c.id.toLowerCase().includes(query) ||
                    (c.description && c.description.toLowerCase().includes(query))
            );
        }

        // Calculate stats
        const totalCategories = categories.length;
        const totalProducts = products.length;
        const averageProductsPerCategory =
            totalCategories > 0 ? parseFloat((totalProducts / totalCategories).toFixed(1)) : 0;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCategories = categories.slice(startIndex, endIndex);
        const totalPages = Math.ceil(totalCategories / limit);

        return {
            categories: paginatedCategories,
            stats: {
                totalCategories,
                totalProducts,
                averageProductsPerCategory,
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCategories,
                itemsPerPage: limit,
            },
        };
    } catch (err) {
        console.error("Error reading categories:", err);
        return {
            categories: [],
            stats: { totalCategories: 0, totalProducts: 0, averageProductsPerCategory: 0 },
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit,
            },
        };
    }
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CategoriesPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";

    const data = await getCategories(search, page, limit);

    return (
        <CategoriesTableClient
            categories={data.categories}
            stats={data.stats}
            pagination={data.pagination}
        />
    );
}
