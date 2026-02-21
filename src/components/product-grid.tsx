"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { Loader2, ShoppingCart, Eye, Package, PackageOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type Product = {
  id: string;
  title: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
  stock?: number;
};

export default function ProductGrid({
  products,
  viewMode = 'grid',
}: {
  products: Product[];
  viewMode?: 'grid' | 'list';
}) {
  const { addItem } = useCart();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAdd = async (id: string, title: string) => {
    setLoadingId(id);
    try {
      await addItem(id, title);
    } finally {
      setLoadingId(null);
    }
  };

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No products found"
        description="We couldn't find any products matching your criteria. Try adjusting your filters."
        actionLabel="Clear Filters"
        actionHref="/products"
      />
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {products.map((p, index) => {
          const inStock = (p.stock ?? 0) > 0;
          const lowStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;

          return (
            <Card
              key={p.id}
              className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-[2rem] bg-background animate-in fade-in slide-in-from-bottom-2 fill-mode-both group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row gap-8 p-8">
                {/* Image */}
                <Link
                  href={`/products/${p.id}`}
                  className="flex-shrink-0 w-full sm:w-64 h-64 relative overflow-hidden rounded-3xl bg-muted"
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.title || 'Product image'}
                      fill
                      sizes="256px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-10">
                    {!inStock && (
                      <Badge variant="destructive" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-widest shadow-xl border-2 border-background">
                        Sold Out
                      </Badge>
                    )}
                    {lowStock && inStock && (
                      <Badge className="bg-orange-500 text-white rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-widest shadow-xl border-2 border-background">
                        Last {p.stock}
                      </Badge>
                    )}
                  </div>
                </Link>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        {p.category && (
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                            {p.category}
                          </p>
                        )}
                        <h3 className="text-3xl font-bold tracking-tight text-foreground">
                          <Link href={`/products/${p.id}`} className="hover:text-primary transition-colors">
                            {p.title}
                          </Link>
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-foreground">${p.price}</div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">USD Tax Inc.</p>
                      </div>
                    </div>
                    {p.description && (
                      <p className="text-base text-muted-foreground line-clamp-2 mb-6 leading-relaxed font-medium">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      onClick={() => handleAdd(p.id, p.title)}
                      disabled={loadingId === p.id || !inStock}
                      className="h-14 px-10 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-[11px] rounded-xl shadow-xl shadow-foreground/10 transition-all active:scale-95"
                    >
                      {loadingId === p.id ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          <span>Add to Cart</span>
                        </div>
                      )}
                    </Button>
                    <Button variant="outline" asChild className="h-14 px-10 rounded-xl font-bold border-2 border-border hover:bg-muted transition-all">
                      <Link href={`/products/${p.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // Grid View - Professional Minimalist Style
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((p, index) => {
        const inStock = (p.stock ?? 0) > 0;
        const lowStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;

        return (
          <Card
            key={p.id}
            className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-background animate-in fade-in slide-in-from-bottom-4 fill-mode-both relative"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Product Image */}
            <Link href={`/products/${p.id}`} className="block relative aspect-[4/5] overflow-hidden bg-muted">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.title || 'Product image'}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/30">
                  <Package className="h-16 w-16 text-muted-foreground/20" />
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                {!inStock && (
                    <Badge variant="destructive" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-widest shadow-xl border-2 border-background">
                    Sold Out
                    </Badge>
                )}
                {lowStock && inStock && (
                    <Badge className="bg-orange-500 text-white rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-widest shadow-xl border-2 border-background">
                    Last {p.stock}
                    </Badge>
                )}
              </div>

              {/* View Overlay */}
              <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[1px]">
                <div className="px-6 py-3 bg-background text-foreground border border-foreground/10 rounded-full font-bold text-[10px] uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    View Product →
                </div>
              </div>
            </Link>

            {/* Content Section */}
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                {/* Category */}
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    {p.category || "General"}
                </p>

                {/* Title */}
                <h3 className="text-xl font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors leading-none">
                  <Link href={`/products/${p.id}`}>
                    {p.title}
                  </Link>
                </h3>
              </div>

              {/* Price & Action */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-foreground">
                        ${p.price}
                    </div>
                </div>

                <Button
                    onClick={() => handleAdd(p.id, p.title)}
                    disabled={loadingId === p.id || !inStock}
                    className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all shadow-xl shadow-foreground/5"
                    size="lg"
                >
                    {loadingId === p.id ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing</span>
                    </div>
                    ) : (
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Add to Cart</span>
                    </div>
                    )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
