import React from "react";
import { cookies } from 'next/headers';
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getCategories() {
    try {
        // Get cookies from request
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch from backend with cookies
        const response = await fetch(`${BACKEND_API_URL}/categories`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch categories:', response.status);
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

        const data = await response.json();
        const categories = data.success && data.data ? data.data : [];

        // Calculate stats
        const totalCategories = categories.length;
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
