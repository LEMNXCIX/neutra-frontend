"use client";
import React from "react";
import Image from 'next/image';
import { Button } from "./ui/button";
import { useCart } from "@/context/cart-context";

export default function ProductGrid({ products }: { products: { id: string; title: string; price: number; description?: string; image?: string; category?: string }[] }) {
  const { addItem, loading } = useCart();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {products.map((p) => (
        <div key={p.id} className="border rounded-md overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
          <div className="h-44 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            {p.image ? (
              <a href={`/products/${p.id}`} className="block w-full h-full relative">
                <Image src={p.image} alt={p.title} className="w-full h-full object-cover" fill sizes="(max-width: 640px) 100vw, 33vw" />
              </a>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium"><a href={`/products/${p.id}`}>{p.title}</a></h3>
                <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">${p.price}</div>
                {p.category && <div className="text-xs text-muted-foreground">{p.category}</div>}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={() => addItem(p.id, p.title)} disabled={loading}>{loading ? '...' : 'Add to cart'}</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
