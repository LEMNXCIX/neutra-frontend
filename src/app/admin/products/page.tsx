import React from "react";
import fs from "fs";
import path from "path";
import ProductsTableClient from "@/components/admin/products/ProductsTableClient";

const PRODUCTS_PATH = path.join(process.cwd(), "src", "data", "products.json");
const CATEGORIES_PATH = path.join(process.cwd(), "src", "data", "categories.json");

type Product = {
    id: string;
    title: string;
    price: number;
    stock?: number;
    category?: string;
    image?: string;
};

async function getProducts(search: string, category: string, page: number, limit: number) {
    // SIMULATION: In a real scenario, this would be:
    // const res = await fetch(`https://api.external.com/products?search=${search}...`, {
    //   headers: { Authorization: `Bearer ${process.env.API_KEY}` }
    // });
    // return res.json();

    try {
        const raw = fs.readFileSync(PRODUCTS_PATH, "utf-8");
        let products = JSON.parse(raw) as Array<Product>;

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            products = products.filter(
                (p) =>
                    p.title.toLowerCase().includes(query) ||
                    p.id.toLowerCase().includes(query)
            );
        }

        if (category && category !== "all") {
            products = products.filter((p) => p.category === category);
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
        console.error("Error reading products:", err);
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
        const raw = fs.readFileSync(CATEGORIES_PATH, "utf-8");
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : (data.categories || []);
    } catch {
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
