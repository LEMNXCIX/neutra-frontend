"use client";
import React, { useEffect, useState } from 'react';
import ProductGrid from './product-grid';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
  id: string;
  title: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/products')
      .then(r => r.json())
      .then(d => {
        if (mounted) setProducts(d.products.slice(0, 4));
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false };
  }, []);

  // Skeleton con exactamente 4 tarjetas (mismo grid que el real)
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow rounded-2xl bg-background/80"
          >
            {/* Imagen */}
            <div className="relative aspect-square overflow-hidden bg-muted/50">
              <Skeleton className="w-full h-full" />
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Título + categoría */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>

              {/* Precio + rating */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-24 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>

              {/* Botón */}
              <Skeleton className="h-11 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return <ProductGrid products={products} />;
}