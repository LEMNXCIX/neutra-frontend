import React, { Suspense } from "react";
import ProductsPage from "./products-client";
import { backendFetch } from "@/lib/backend-api";
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
		const result = await backendFetch("/categories?type=PRODUCT", {
			cache: "no-store",
		});

		if (!result.success) return [];

		const data = result.data as any;
		if (Array.isArray(data)) return data;
		if (data?.categories) return data.categories;
		if (data?.data?.categories) return data.data.categories;
		if (Array.isArray(data?.data)) return data.data;

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
        // Forward filters to backend
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (category && category !== "all")
            queryParams.set("category", category);

        const result = await backendFetch(
            `/products?${queryParams.toString()}`,
            {
                cache: "no-store",
            },
        );

        if (!result.success) return [];

        const data = result.data as any;
        const allProducts = (data?.products || data || []) as any[];

        // Map backend Product to frontend Product
        return allProducts.map((p) => ({
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
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
