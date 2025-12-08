import ProductsPage from "./products-client";
import { productsService } from "@/services";
import type { Product as BackendProduct } from "@/types/frontend-api";

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
    // Server-side fetch to our own API route
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const res = await fetch(`${baseUrl}/products`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      console.error(`Failed to fetch products: ${res.status}`);
      return [];
    }

    const data = await res.json();
    // Handle StandardResponse format
    const allProducts = (data.data || data.products || []) as BackendProduct[];

    let filtered = allProducts;

    // Apply search filter
    if (search) {
      const query = search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description || "").toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (category && category !== "all") {
      filtered = filtered.filter((p) => {
        // Check if product has categories array
        if (p.categories && Array.isArray(p.categories)) {
          return p.categories.some(
            (c: any) =>
              (typeof c === "string" ? c : c.id || c.name) === category
          );
        }
        return false;
      });
    }

    // Map backend Product to frontend Product
    return filtered.map((p) => ({
      id: p.id,
      title: p.name, // Map name to title
      price: p.price,
      description: p.description,
      image: p.image || undefined,
      category: (() => {
        const cat = p.categories?.[0];
        if (!cat) return undefined;
        return typeof cat === 'string' ? cat : (cat.name || cat.id || undefined);
      })(),
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

  const products = await fetchProducts(search, category);

  return <ProductsPage products={products} />;
}
