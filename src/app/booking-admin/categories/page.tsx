import React from "react";
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getCategories() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch categories from backend (filtered by type SERVICE)
        const response = await fetch(`${BACKEND_API_URL}/categories?type=SERVICE`, {
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
                stats: { totalCategories: 0, totalProducts: 0, averageProductsPerCategory: 0 },
            };
        }

        const data = await response.json();
        const categories = data.success && data.data ? data.data : [];

        // Stats from backend if available, otherwise calculate
        const stats = data.stats || {
            totalCategories: categories.length,
            totalProducts: categories.reduce((sum: number, c: any) => sum + (c.productCount || 0), 0),
            averageProductsPerCategory: categories.length > 0
                ? Math.round(categories.reduce((sum: number, c: any) => sum + (c.productCount || 0), 0) / categories.length)
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
            stats: { totalCategories: 0, totalProducts: 0, averageProductsPerCategory: 0 },
        };
    }
}

export default async function BookingCategoriesPage() {
    const data = await getCategories();

    return (
        <div className="p-6">
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
        </div>
    );
}
