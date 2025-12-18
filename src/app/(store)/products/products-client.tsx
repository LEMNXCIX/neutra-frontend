"use client";

import React, { useTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  SlidersHorizontal,
  Package,
  Grid3x3,
  List,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import ProductGrid from "@/components/product-grid";
import { categoriesService } from "@/services/categories.service";
import { Category } from "@/types/category.types";

// Removed local Category type definition as we import it now
type Product = {
  id: string;
  title: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
  stock?: number;
};

export default function ProductsPage({ products }: { products: Product[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesService.getAll();
        setCategories(data || []);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  const search = params.get("search") || "";
  const category = params.get("category") || "all";

  const handleSearch = (value: string) => {
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

  const clearFilters = () => {
    startTransition(() => {
      router.push('/products');
    });
  };

  const activeFiltersCount = [search, category !== "all" ? category : null].filter(Boolean).length;
  const selectedCategory = categories.find((c) => c.id === category);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Package className="h-8 w-8" />
                Products
              </h1>
              <p className="text-muted-foreground">
                {products.length} {products.length === 1 ? 'product' : 'products'} available
              </p>
            </div>

            {/* View Toggle - Desktop Only */}
            <div className="hidden sm:flex items-center gap-2 bg-background border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {search}
                  <button
                    onClick={() => handleSearch("")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {category !== "all" && selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  Category: {selectedCategory.name}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters Section */}
        <div className="mb-6">
          {/* Mobile Filter Toggle */}
          <div className="sm:hidden mb-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6 bg-card border rounded-lg shadow-sm">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Products
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search by name..."
                    defaultValue={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pr-8"
                  />
                  {isPending && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Category
                </label>
                <Select value={category || "all"} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="p-4 bg-primary/5 rounded-lg w-full">
                  <p className="text-sm text-muted-foreground mb-1">Results</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {search || category !== "all"
                ? "Try adjusting your filters or search terms"
                : "There are no products available at the moment"
              }
            </p>
            {activeFiltersCount > 0 && (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
            <ProductGrid products={products} viewMode={viewMode} />
          </div>
        )}
      </div>
    </main>
  );
}
