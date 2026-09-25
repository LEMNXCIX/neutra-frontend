import type { Metadata } from "next";
import { api } from '@/lib/api-client';
import { getTenantNameFromHeaders } from "@/lib/server-theme";
import { getHomeContent } from "@/lib/strapi";
import { StoreHomeClient } from "./store-client";

export const metadata: Metadata = {
    title: "Inicio",
    description:
        "Bienvenido a nuestra tienda: explorá colecciones y productos destacados",
};

async function fetchSliders(): Promise<any[]> {
    try {
        const data = await api.get<any>("/slide?activeOnly=true");
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
    const [sliders, featuredProducts, tenantName, cms] = await Promise.all([
        fetchSliders(),
        fetchFeaturedProducts(),
        getTenantNameFromHeaders(),
        getHomeContent(),
    ]);
    return (
        <StoreHomeClient
            initialSliders={sliders}
            initialProducts={featuredProducts}
            tenantName={tenantName}
            cms={cms}
        />
    );
}
