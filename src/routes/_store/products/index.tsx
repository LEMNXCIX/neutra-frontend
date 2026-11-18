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

const getProductsData = createServerFn({ method: "GET" })
    .validator((data: { search: string; category: string }) => data)
    .handler(async ({ data }) => {
        const { api } = await import("@/lib/api-client");

        const fetchCategories = async (): Promise<Category[]> => {
            try {
                const payload = await api.get<any>("/categories?type=PRODUCT");
                if (Array.isArray(payload)) return payload;
                if (payload?.categories) return payload.categories;
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

                const payload = await api.get<any>(
                    `/products?${queryParams.toString()}`,
                );
                const allProducts =
                    payload?.products ||
                    (Array.isArray(payload) ? payload : []);

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

        // Mirror the original page's server fetch: the validated URL search still
        // filters the first backend payload, so deep links keep their result set.
        const [products, categories] = await Promise.all([
            fetchProducts(data.search, data.category),
            fetchCategories(),
        ]);
        return { products, categories };
    });

export const Route = createFileRoute("/_store/products/")({
    // Optional fields keep every existing <Link to="/products"> valid; the
    // loader applies the same defaults the original page used.
    validateSearch: (
        search: Record<string, unknown>,
    ): { search?: string; category?: string } => ({
        search: typeof search.search === "string" ? search.search : undefined,
        category:
            typeof search.category === "string" ? search.category : undefined,
    }),
    loaderDeps: ({ search }) => ({
        search: search.search ?? "",
        category: search.category ?? "all",
    }),
    loader: ({ deps }) => getProductsData({ data: deps }),
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
