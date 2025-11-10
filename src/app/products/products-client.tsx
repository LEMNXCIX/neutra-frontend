"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ProductGrid from "@/components/product-grid";
import categories from "@/data/categories.json";

type Category = { id: string; name: string };
type Product = { id: string; title: string; price: number; description?: string; image?: string; category?: string };

export default function ProductsPage({ products }: { products: Product[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = params.get("search") || "";
  const category = params.get("category") || "all";

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    startTransition(() => {
      const newParams = new URLSearchParams(params);
      if (value) newParams.set("search", value);
      else newParams.delete("search");
      router.push(`/products?${newParams.toString()}`);
    });
  };

  const handleCategoryChange = (value: string) => {
    startTransition(() => {
      const newParams = new URLSearchParams(params);
      if (value === "all") newParams.delete("category");
      else newParams.set("category", value);
      router.push(`/products?${newParams.toString()}`);
    });
  };

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        {search && (
          <span className="text-sm text-muted-foreground">
            Showing results for <span className="font-medium">“{search}”</span>
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-sm">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search products..."
            defaultValue={search}
            onChange={handleSearch}
            className="mt-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">Category:</Label>
          <Select value={category || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {(categories as Category[]).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isPending && (
          <Button variant="ghost" disabled className="pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground border rounded-md">
          No products found.
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </main>
  );
}
