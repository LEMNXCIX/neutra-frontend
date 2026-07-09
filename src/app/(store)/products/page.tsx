import React, { Suspense } from "react";
import ProductsPage from "./products-client";
import { api } from '@/lib/api-client';
import type { Metadata } from "next";
import type { Category } from "@/types/category.types";

export const metadata: Metadata = {
    title: "Products",
    description: "Browse our complete product catalog",
};

// Frontend expects 'title' but backend uses 'name'
type FrontendProduct = {
    id: string;
    title: string;
    price: number;
    description?: string;
    image?: string;
    category?: string;
    stock?: number;
};

async function fetchCategories(): Promise<Category[]> {
    try {
        const data = await api.get<any>("/categories?type=PRODUCT");
        if (Array.isArray(data)) return data;
        if (data?.categories) return data.categories;
        return [];
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

async function fetchProducts(
    search?: string,
    category?: string,
): Promise<FrontendProduct[]> {
    try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (category && category !== "all")
            queryParams.set("category", category);

        const data = await api.get<any>(`/products?${queryParams.toString()}`);
        const allProducts = (data?.products || (Array.isArray(data) ? data : []));

        return allProducts.map((p: any) => ({
            id: p.id,
            title: p.name,
            price: p.price,
            description: p.description,
            image: p.image || undefined,
            category: p.categories?.[0]?.name || undefined,
            stock: p.stock,
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

type Props = {
    searchParams: Promise<{ search?: string; category?: string }>;
};

export default async function Page({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;

    const search =
        typeof resolvedSearchParams.search === "string"
            ? resolvedSearchParams.search
            : "";
    const category =
        typeof resolvedSearchParams.category === "string"
            ? resolvedSearchParams.category
            : "all";

  const [products, categories] = await Promise.all([
    fetchProducts(search, category),
    fetchCategories(),
  ]);

	return (
		<Suspense fallback={null}>
			<ProductsPage products={products} categories={categories} />
        </Suspense>
    );
}
