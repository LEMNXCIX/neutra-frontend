import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import ProductsTableClient from "@/components/admin/products/ProductsTableClient";
import type { Product } from "@/types/product.types";

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

type ProductsSearch = {
    search?: string;
    category?: string;
    page?: string;
    limit?: string;
};

const getProductsData = createServerFn({ method: "GET" })
    .validator((data: ProductsSearch) => data)
    .handler(async ({ data }) => {
        const { api } = await import("@/lib/api-client");

        const search = data.search ?? "";
        const category = data.category ?? "all";
        const page =
            typeof data.page === "string" ? parseInt(data.page, 10) : 1;
        const limit =
            typeof data.limit === "string" ? parseInt(data.limit, 10) : 12;

        const getProducts = async () => {
            try {
                const payload = await api.get<any>("/products");
                let products: Product[] = [];
                const list =
                    payload?.products ||
                    (Array.isArray(payload) ? payload : []);
                products = list.map((p: BackendProduct) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description || "",
                    price: p.price,
                    stock: p.stock,
                    categories: p.categories || [],
                    image: p.image || undefined,
                    ownerId: p.ownerId || "",
                    createdAt: p.createdAt || new Date(),
                    updatedAt: p.updatedAt || new Date(),
                }));

                if (search) {
                    const query = search.toLowerCase();
                    products = products.filter(
                        (p) =>
                            p.name.toLowerCase().includes(query) ||
                            p.id.toLowerCase().includes(query),
                    );
                }
                if (category && category !== "all") {
                    products = products.filter((p) =>
                        p.categories?.some((cat) =>
                            typeof cat === "string"
                                ? cat === category
                                : cat.id === category || cat.name === category,
                        ),
                    );
                }

                const totalProducts = products.length;
                const totalValue = products.reduce(
                    (sum, p) => sum + p.price * (p.stock || 0),
                    0,
                );
                const lowStockCount = products.filter(
                    (p) => (p.stock || 0) < 10,
                ).length;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                return {
                    products: products.slice(startIndex, endIndex),
                    stats: { totalProducts, totalValue, lowStockCount },
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalProducts / limit),
                        totalItems: totalProducts,
                        itemsPerPage: limit,
                    },
                };
            } catch (err) {
                console.error("Error fetching products:", err);
                return {
                    products: [],
                    stats: {
                        totalProducts: 0,
                        totalValue: 0,
                        lowStockCount: 0,
                    },
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: limit,
                    },
                };
            }
        };

        const getCategories = async () => {
            try {
                const payload = await api.get<any>("/categories");
                return payload
                    ? payload.categories ||
                          (Array.isArray(payload) ? payload : [])
                    : [];
            } catch (error) {
                console.error("Error fetching categories:", error);
                return [];
            }
        };

        const [productsData, categories] = await Promise.all([
            getProducts(),
            getCategories(),
        ]);
        return { productsData, categories };
    });

export const Route = createFileRoute("/_storeAdmin/store-admin/products/")({
    validateSearch: (search: Record<string, unknown>): ProductsSearch => ({
        search: typeof search.search === "string" ? search.search : undefined,
        category:
            typeof search.category === "string" ? search.category : undefined,
        page: typeof search.page === "string" ? search.page : undefined,
        limit: typeof search.limit === "string" ? search.limit : undefined,
    }),
    loaderDeps: ({ search }) => ({
        search: search.search ?? "",
        category: search.category ?? "all",
        page: search.page ?? "1",
        limit: search.limit ?? "12",
    }),
    loader: ({ deps }) => getProductsData({ data: deps }),
    head: () => ({
        meta: [
            { title: "Productos" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: StoreAdminProductsRoute,
});

function StoreAdminProductsRoute() {
    const { productsData, categories } = Route.useLoaderData();
    return (
        <ProductsTableClient
            products={productsData.products}
            stats={productsData.stats}
            pagination={productsData.pagination}
            categories={categories}
        />
    );
}
