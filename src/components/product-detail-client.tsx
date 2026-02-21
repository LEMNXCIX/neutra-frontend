"use client";
import React, { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "./ui/button";
import {
    Loader2,
    Sparkles,
    ShoppingBag as ShoppingBagIcon,
} from "lucide-react";
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
        <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full">
          <div className="relative flex-1 group">
            <label className="absolute -top-2 left-4 bg-foreground text-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest z-10 rounded-full">
              Quantity
            </label>
            <input
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full h-16 bg-background border-2 border-border text-foreground px-6 font-bold text-2xl outline-none focus:border-foreground transition-all rounded-xl"
            />
          </div>
    
          <Button
            onClick={handleAdd}
            disabled={loading}
            className="h-16 px-12 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all active:scale-[0.98] group border-none shadow-xl shadow-foreground/10"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <ShoppingBagIcon className="w-5 h-5" />
                <span>Add to Cart</span>
              </div>
            )}
          </Button>
        </div>
      );}
