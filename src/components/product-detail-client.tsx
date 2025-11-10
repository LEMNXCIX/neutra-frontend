"use client";
import React, { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

type Product = { id: string; title: string; price?: number };

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (qty < 1) return;
    setLoading(true);
    try {
      // Añade el producto N veces según cantidad
      for (let i = 0; i < qty; i++) {
        await addItem(product.id, product.title);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="w-20 border border-zinc-300 dark:border-zinc-700 p-2 rounded-md text-center"
      />

      <Button
        onClick={handleAdd}
        disabled={loading}
        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md transition-colors"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Adding...</span>
          </div>
        ) : (
          "Add to cart"
        )}
      </Button>
    </div>
  );
}
