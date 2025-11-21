"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { Loader2, ShoppingCart, Eye, Package } from "lucide-react";

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

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {products.map((p) => {
          const inStock = (p.stock ?? 0) > 0;
          const lowStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;

          return (
            <Card
              key={p.id}
              className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all"
            >
              <div className="flex flex-col sm:flex-row gap-6 p-6">
                {/* Image */}
                <Link
                  href={`/products/${p.id}`}
                  className="flex-shrink-0 w-full sm:w-48 h-48 relative group overflow-hidden rounded-lg bg-muted"
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="192px"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  {!inStock && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Out of Stock
                    </Badge>
                  )}
                  {lowStock && inStock && (
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-yellow-500 text-white">
                      Low Stock
                    </Badge>
                  )}
                </Link>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        {p.category && (
                          <Badge variant="secondary" className="mb-2">
                            {p.category}
                          </Badge>
                        )}
                        <h3 className="text-xl font-semibold mb-2">
                          <Link href={`/products/${p.id}`} className="hover:text-primary transition-colors">
                            {p.title}
                          </Link>
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">${p.price}</div>
                      </div>
                    </div>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => handleAdd(p.id, p.title)}
                      disabled={loadingId === p.id || !inStock}
                      className="flex-1 sm:flex-none"
                    >
                      {loadingId === p.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button variant="outline" asChild className="flex-1 sm:flex-none">
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

  // Grid View
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((p) => {
        const inStock = (p.stock ?? 0) > 0;
        const lowStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;

        return (
          <Card
            key={p.id}
            className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all group"
          >
            {/* Image */}
            <Link href={`/products/${p.id}`} className="block relative aspect-square overflow-hidden bg-muted">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-muted-foreground" />
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button variant="secondary" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>

              {/* Stock Badge */}
              {!inStock && (
                <Badge variant="destructive" className="absolute top-3 right-3">
                  Out of Stock
                </Badge>
              )}
              {lowStock && inStock && (
                <Badge variant="secondary" className="absolute top-3 right-3 bg-yellow-500 text-white hover:bg-yellow-500">
                  Low Stock
                </Badge>
              )}
            </Link>

            {/* Content */}
            <CardContent className="p-4 space-y-3">
              {/* Category */}
              {p.category && (
                <Badge variant="secondary" className="text-xs">
                  {p.category}
                </Badge>
              )}

              {/* Title */}
              <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
                <Link href={`/products/${p.id}`} className="hover:text-primary transition-colors">
                  {p.title}
                </Link>
              </h3>

              {/* Description */}
              {p.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {p.description}
                </p>
              )}

              {/* Price */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-2xl font-bold text-primary">
                  ${p.price}
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={() => handleAdd(p.id, p.title)}
                disabled={loadingId === p.id || !inStock}
                className="w-full"
                size="lg"
              >
                {loadingId === p.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}