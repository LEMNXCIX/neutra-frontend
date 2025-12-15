"use client";
import React, { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Product = { id: string; title: string; price?: number; stock?: number };

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (qty < 1) return;

    // Validate quantity against stock if available
    if (product.stock !== undefined && qty > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }

    setLoading(true);
    try {
      // Send quantity in a single request
      await addItem(product.id, product.title, qty);
      setQty(1); // Reset quantity after successful add
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={1}
        max={product.stock}
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
