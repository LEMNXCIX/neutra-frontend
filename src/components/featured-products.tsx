"use client";
import React, { useEffect, useState } from 'react';
import ProductGrid from './product-grid';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Product = { id: string; title: string; price: number; description?: string; image?: string; category?: string };

export default function FeaturedProducts(){
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { if(mounted) setProducts(d.products.slice(0,3)); })
      .finally(()=>mounted && setLoading(false));
    return ()=>{ mounted = false };
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {[1, 2, 3].map((i) => (
        <Card
          key={i}
          className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="text-xs text-muted-foreground mt-1 h-3 w-48" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="w-full h-10" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  return <ProductGrid products={products} />;
}