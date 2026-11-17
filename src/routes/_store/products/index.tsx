import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import ProductsPage from "@/app/(store)/products/products-client";
import type { Category } from "@/types/category.types";

type FrontendProduct = {
    id: string;
    title: string;
    price: number;
    description?: string;
    image?: string;
    category?: string;
    stock?: number;
};

const getProductsData = createServerFn({ method: "GET" }).handler(async () => {
    const { api } = await import("@/lib/api-client");

    const fetchCategories = async (): Promise<Category[]> => {
        try {
            const data = await api.get<any>("/categories?type=PRODUCT");
            if (Array.isArray(data)) return data;
            if (data?.categories) return data.categories;
            return [];
        } catch (error) {
            console.error("Error fetching categories:", error);
            return [];
        }
    };

    const fetchProducts = async (
        search?: string,
        category?: string,
    ): Promise<FrontendProduct[]> => {
        try {
            const queryParams = new URLSearchParams();
            if (search) queryParams.set("search", search);
            if (category && category !== "all")
                queryParams.set("category", category);

            const data = await api.get<any>(
                `/products?${queryParams.toString()}`,
            );
            const allProducts =
                data?.products || (Array.isArray(data) ? data : []);

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
    };

    // The original page read `search`/`category` from searchParams. The
    // client component owns those filters through its router hooks, so the
    // initial server payload is the unfiltered catalogue, matching the
    // no-query first paint.
    const [products, categories] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
    ]);
    return { products, categories };
});

export const Route = createFileRoute("/_store/products/")({
    loader: () => getProductsData(),
    head: () => ({
        meta: [
            { title: "Productos" },
            {
                name: "description",
                content: "Explora nuestro catálogo completo de productos",
            },
        ],
    }),
    component: ProductsRoute,
});

function ProductsRoute() {
    const { products, categories } = Route.useLoaderData();
    return <ProductsPage products={products} categories={categories} />;
}
