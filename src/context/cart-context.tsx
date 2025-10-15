"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from './toast-context';

type CartItem = { id: string; name: string; qty: number };

type CartContextType = {
  items: CartItem[];
  count: number;
  loading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
  addItem: (id: string, name: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchCart = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/cart");
    if (!res.ok) {
      setError("Failed to fetch cart");
      setLoading(false);
      showToast("Error fetching cart", "error");
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (id: string, name: string) => {
    setLoading(true);
    await fetch("/api/cart", { method: "POST", body: JSON.stringify({ id, name }), headers: { "Content-Type": "application/json" } });
    await fetchCart();
    setLoading(false);
    showToast("Added to cart", "success");
  };

  const removeItem = async (id: string) => {
    setLoading(true);
    await fetch(`/api/cart?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await fetchCart();
    setLoading(false);
    showToast("Removed from cart", "info");
  };

  const value: CartContextType = {
    items,
    count: items.reduce((s, it) => s + it.qty, 0),
    loading,
    error,
    refresh: fetchCart,
    addItem,
    removeItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
