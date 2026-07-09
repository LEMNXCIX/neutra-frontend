import type { Metadata } from "next";
import { api } from '@/lib/api-client';
import { StoreHomeClient } from "./store-client";

export const metadata: Metadata = {
    title: "Home",
    description:
        "Welcome to our store — shop curated collections and featured products",
};

async function fetchSliders(): Promise<any[]> {
    try {
        const data = await api.get<any>("/sliders");
        if (Array.isArray(data)) return data;
        return data?.sliders || [];
    } catch {
        return [];
    }
}

async function fetchFeaturedProducts(): Promise<any[]> {
    try {
        const data = await api.get<any>("/products");
        const list = Array.isArray(data) ? data : data?.products || [];
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
