"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { Loader2 } from "lucide-react";

export default function ProductGrid({
  products,
}: {
  products: {
    id: string;
    title: string;
    price: number;
    description?: string;
    image?: string;
    category?: string;
  }[];
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {products.map((p) => (
        <Card
          key={p.id}
          className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {p.image ? (
              <a href={`/products/${p.id}`} className="block w-full h-full">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </a>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-zinc-100 dark:bg-zinc-800">
                No image
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-base">
                  <a href={`/products/${p.id}`} className="hover:underline">
                    {p.title}
                  </a>
                </h3>
                {p.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">${p.price}</div>
                {p.category && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {p.category}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button
                onClick={() => handleAdd(p.id, p.title)}
                disabled={loadingId === p.id}
                className="w-full justify-center bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
              >
                {loadingId === p.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add to cart"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}