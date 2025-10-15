"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from './toast-context';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from './auth-context';
import { useRouter } from 'next/navigation';

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
    try {
      const res = await apiFetch('/api/cart');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError('Failed to fetch cart');
      showToast('Error fetching cart', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const auth = useAuth();
  const router = useRouter();

  const addItem = async (id: string, name: string) => {
    if (!auth?.user) {
      showToast('Please log in to add items to your cart', 'error');
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/cart', { method: 'POST', body: JSON.stringify({ id, name }), headers: { 'Content-Type': 'application/json' } });
      await fetchCart();
      showToast('Added to cart', 'success');
    } catch (errUnknown) {
      const e = errUnknown as unknown as { message?: string };
      showToast(e?.message || 'Failed to add to cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    setLoading(true);
    try {
      await apiFetch(`/api/cart?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await fetchCart();
      showToast('Removed from cart', 'info');
    } catch (errUnknown) {
      const e = errUnknown as unknown as { message?: string };
      showToast(e?.message || 'Failed to remove item', 'error');
    } finally {
      setLoading(false);
    }
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
