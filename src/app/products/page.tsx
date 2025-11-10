import ProductsPage from "./products-client"; // 👈 importar tu componente cliente
import categories from "@/data/categories.json";

type Category = { id: string; name: string };

async function fetchProducts(search?: string, category?: string) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000";

  const url = new URL("/api/products", base);
  if (search) url.searchParams.set("search", search);
  if (category && category !== "all") url.searchParams.set("category", category);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.products;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] };
}) {
  const getParam = (k: string) => {
    const v = searchParams?.[k];
    if (!v) return "";
    return Array.isArray(v) ? v[0] : v;
  };

  const search = getParam("search") || "";
  const category = getParam("category") || "all";

  const products = await fetchProducts(search, category);

  // 👇 Pasamos los productos al componente cliente
  return <ProductsPage products={products} />;
}
