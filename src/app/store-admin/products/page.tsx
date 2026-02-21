import React from "react";
import ProductsTableClient from "@/components/admin/products/ProductsTableClient";
import { extractTokenFromCookies } from "@/lib/server-auth";
import { get as backendGet } from "../../../lib/backend-api";
import { Product } from '@/types/product.types';

export const dynamic = 'force-dynamic';

async function getProducts(search: string, category: string, page: number, limit: number) {
    try {
        const token = (await extractTokenFromCookies()) || undefined;

        // Fetch products from backend
        const result = await backendGet('/products', token);

        // Map backend Product to frontend Product
        let products: Product[] = [];
        type BackendProduct = {
            id: string;
            name: string;
            description?: string;
            price: number;
            stock?: number;
            categories?: Array<{ id: string; name: string }>;
            image?: string;
            ownerId?: string;
            createdAt?: string;
            updatedAt?: string;
        };
        if (result.success && result.data) {
            const data = result.data as any;
            const list = data.products || (Array.isArray(data) ? data : []);
            products = list.map((p: BackendProduct) => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                price: p.price,
                stock: p.stock,
                categories: p.categories || [],
                image: p.image || undefined,
                ownerId: p.ownerId || '',
                createdAt: p.createdAt || new Date(),
                updatedAt: p.updatedAt || new Date(),
            }));
        }

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            products = products.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.id.toLowerCase().includes(query)
            );
        }

        if (category && category !== "all") {
            products = products.filter((p) =>
                p.categories?.some((cat) =>
                    typeof cat === 'string' ? cat === category : cat.id === category || cat.name === category
                )
            );
        }

        // Calculate stats from ALL filtered products (before pagination)
        const totalProducts = products.length;
        const totalValue = products.reduce(
            (sum, p) => sum + p.price * (p.stock || 0),
            0
        );
        const lowStockCount = products.filter((p) => (p.stock || 0) < 10).length;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = products.slice(startIndex, endIndex);
        const totalPages = Math.ceil(totalProducts / limit);

        return {
            products: paginatedProducts,
            stats: {
                totalProducts,
                totalValue,
                lowStockCount,
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalProducts,
                itemsPerPage: limit,
            },
        };
    } catch (err) {
        console.error("Error fetching products:", err);
        return {
            products: [],
            stats: { totalProducts: 0, totalValue: 0, lowStockCount: 0 },
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit,
            },
        };
    }
}

async function getCategories() {
    try {
        const token = (await extractTokenFromCookies()) || undefined;
        const result = await backendGet('/categories', token);

        if (!result.success) {
            return [];
        }

        const data = result.data as any;
        return data ? (data.categories || data) : [];
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProductsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 12;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "all";

    const data = await getProducts(search, category, page, limit);
    const categories = await getCategories();

    return (
        <ProductsTableClient
            products={data.products}
            stats={data.stats}
            pagination={data.pagination}
            categories={categories}
        />
    );
}
