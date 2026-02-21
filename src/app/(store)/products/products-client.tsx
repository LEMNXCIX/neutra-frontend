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
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/5 to-pink-500/10 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4">
              <Badge variant="outline" className="rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary font-bold uppercase tracking-widest text-[10px]">
                Curated Selection
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground leading-none">
                Our <span className="text-primary">Collection</span>
              </h1>
              <p className="text-muted-foreground text-lg font-medium max-w-lg">
                Discover {products.length} handpicked pieces designed for modern, minimalist living.
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-3 bg-background/50 backdrop-blur-md border border-border/50 p-2 rounded-2xl shadow-xl">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`rounded-xl transition-all ${viewMode === 'grid' ? 'shadow-lg shadow-primary/20' : ''}`}
              >
                <Grid3x3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={`rounded-xl transition-all ${viewMode === 'list' ? 'shadow-lg shadow-primary/20' : ''}`}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-8">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active:</span>
              {search && (
                <Badge variant="secondary" className="gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border-none">
                  <Search className="h-3 w-3" />
                  {search}
                  <button
                    onClick={() => handleSearch("")}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {category !== "all" && selectedCategory && (
                <Badge variant="secondary" className="gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 border-none">
                  <SlidersHorizontal className="h-3 w-3" />
                  {selectedCategory.name}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="hover:bg-purple-500/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs font-bold uppercase tracking-widest hover:text-primary rounded-full"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Filters Section */}
        <div className="mb-12">
          {/* Mobile Filter Toggle */}
          <div className="sm:hidden mb-4">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2 text-primary" />
              Refine Search
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className={`${showFilters ? 'block animate-in fade-in slide-in-from-top-4' : 'hidden'} sm:block`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-background/50 backdrop-blur-md border border-border/50 rounded-[2rem] shadow-2xl shadow-primary/5">
              {/* Search */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Keywords
                </label>
                <div className="relative group">
                  <Input
                    placeholder="What are you looking for?"
                    defaultValue={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="h-12 pr-10 border-border/50 rounded-xl focus:ring-4 focus:ring-primary/5 group-hover:border-primary/50 transition-all"
                  />
                  {isPending && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-purple-500" />
                  Category
                </label>
                <Select value={category || "all"} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-12 border-border/50 rounded-xl hover:border-purple-500/50 transition-all">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="all">Everything</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Results Summary */}
              <div className="flex items-end">
                <div className="p-4 bg-primary/5 rounded-2xl w-full border border-primary/10 flex items-center justify-between group hover:bg-primary/10 transition-colors">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Items Found</p>
                    <p className="text-3xl font-black text-primary leading-none">{products.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary/20 group-hover:scale-110 transition-transform" />
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
