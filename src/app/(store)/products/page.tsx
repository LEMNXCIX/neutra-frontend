import ProductsPage from "./products-client";
import { backendFetch } from "@/lib/backend-api";

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

async function fetchProducts(search?: string, category?: string): Promise<FrontendProduct[]> {
  try {
    // Forward filters to backend
    const queryParams = new URLSearchParams();
    if (search) queryParams.set('search', search);
    if (category && category !== 'all') queryParams.set('category', category);

    const result = await backendFetch(`/products?${queryParams.toString()}`, { 
        cache: 'no-store' 
    });

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

  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "all";

  const products = await fetchProducts(search, category);

  return <ProductsPage products={products} />;
}
