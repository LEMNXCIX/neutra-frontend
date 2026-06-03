import type { Metadata } from "next";
import { backendFetch } from "@/lib/backend-api";
import { StoreHomeClient } from "./store-client";

export const metadata: Metadata = {
    title: "Home",
    description:
        "Welcome to our store — shop curated collections and featured products",
};

async function fetchSliders(): Promise<any[]> {
    try {
        const result = await backendFetch("/sliders", { cache: "no-store" });
        if (!result.success) return [];
        const data = result as any;
        return data.sliders || data.data?.sliders || [];
    } catch {
        return [];
    }
}

async function fetchFeaturedProducts(): Promise<any[]> {
    try {
        const result = await backendFetch("/products", { cache: "no-store" });
        if (!result.success) return [];
        const data = result as any;
        const list = Array.isArray(data.data)
            ? data.data
            : data.data?.products || data.products;
        if (list && Array.isArray(list)) return list.slice(0, 4);
        return [];
    } catch {
        return [];
    }
}

export default async function StoreHomePage() {
    const [sliders, featuredProducts] = await Promise.all([
        fetchSliders(),
        fetchFeaturedProducts(),
    ]);
    return (
        <StoreHomeClient
            initialSliders={sliders}
            initialProducts={featuredProducts}
        />
    );
}
