"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from '@/lib/api-fetch';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

type CartItem = { id: string; name: string; qty: number };
type Coupon = { code: string; type: 'amount' | 'percent'; value: number } | null;

type CartContextType = {
  items: CartItem[];
  count: number;
  loading: boolean;
  error?: string | null;
  subtotal: number; // computed client-side (placeholder pricing)
  discount: number; // computed after applying coupon
  total: number; // subtotal - discount
  coupon: Coupon;
  refresh: () => Promise<void>;
  addItem: (id: string, name: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; reason?: string }>;
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/cart');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError('Failed to fetch cart');
      toast.error('Error fetching cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // coupon state and derived totals
  const [coupon, setCoupon] = useState<Coupon>(null);
  const [discount, setDiscount] = useState(0);
  const [productMap, setProductMap] = useState<Record<string, number>>({});

  // load product prices once so subtotal uses real prices
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/products');
        const data = await res.json().catch(() => ({}));
        const products = (data?.products || []) as Array<{ id: string; price: number }>;
        const map: Record<string, number> = {};
        for (const p of products) map[p.id] = Number(p.price || 0);
        if (mounted) setProductMap(map);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const computeSubtotal = (itemsList: CartItem[]) => {
    return itemsList.reduce((s, it) => {
      const price = productMap[it.id] ?? 0;
      return s + price * it.qty;
    }, 0);
  };

  const subtotal = computeSubtotal(items);
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const addItem = async (id: string, name: string) => {
    if (!user) {
      toast.error('Please log in to add items to your cart');
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/cart', { method: 'POST', body: JSON.stringify({ id, name }), headers: { 'Content-Type': 'application/json' } });
      await fetchCart();
      toast.success('Added to cart');
    } catch (errUnknown) {
      const e = errUnknown as unknown as { message?: string };
      toast.error(e?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    setLoading(true);
    try {
      await apiFetch(`/api/cart?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await fetchCart();
      toast('Removed from cart');
    } catch (errUnknown) {
      const e = errUnknown as unknown as { message?: string };
      toast.error(e?.message || 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, subtotal }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.valid) {
        const reason = data?.reason || 'invalid';
        toast.error(reason === 'already_used' ? 'Coupon already used' : reason === 'expired' ? 'Coupon expired' : 'Invalid coupon');
        setLoading(false);
        return { success: false, reason };
      }

      setCoupon(data.coupon);
      setDiscount(Number(data.discount || 0));
      toast.success('Coupon applied');
      setLoading(false);
      return { success: true };
    } catch {
      toast.error('Failed to validate coupon');
      setLoading(false);
      return { success: false, reason: 'network' };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
    toast('Coupon removed');
  };

  const value: CartContextType = {
    items,
    count: items.reduce((s, it) => s + it.qty, 0),
    loading,
    error,
    subtotal,
    discount,
    total,
    coupon,
    refresh: fetchCart,
    addItem,
    removeItem,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
