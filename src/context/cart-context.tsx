"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { cartService, productsService, couponsService } from '@/services';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useTenant } from "./tenant-context";
import { toast } from "sonner";
import { ApiError } from '@/lib/api-client';
import { Product } from '@/types/product.types';
import { CouponType } from '@/types/coupon.types';

// Internal representation for the context state
type MappedCartItem = {
  id: string; // productId
  cartItemId: string;
  name: string;
  amount: number;
  price?: number;
  image?: string;
  stock?: number;
};

type ContextCoupon = {
  code: string;
  type: 'amount' | 'percent';
  value: number;
} | null;

type CartContextType = {
  items: MappedCartItem[];
  count: number;
  loading: boolean;
  error?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  coupon: ContextCoupon;
  refresh: () => Promise<void>;
  addItem: (id: string, name: string, quantity?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, newQty: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; reason?: string }>;
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<MappedCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<ContextCoupon>(null);
  const [discount, setDiscount] = useState(0);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});

  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { moduleType } = useTenant();

  const fetchCart = React.useCallback(async () => {
    if (!user || moduleType?.toUpperCase() !== 'STORE') {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cart = await cartService.get();


      const mappedItems: MappedCartItem[] = cart?.map((item) => {
        return {
          id: item.id,
          cartItemId: item.id,
          name: item.name || 'Unknown',
          amount: item.amount,
          price: item.price,
          image: item.image || undefined,
          stock: item.stock,
        };
      }) ?? [];

      setItems(mappedItems);
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to fetch cart';
      setError(errorMsg);
      console.error('❌ Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, moduleType]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Load product prices for accurate calculations
  useEffect(() => {
    let mounted = true;
    if (moduleType?.toUpperCase() !== 'STORE') return;

    (async () => {
      try {
        const products = await productsService.getAll();
        if (mounted) {
          const map: Record<string, Product> = {};
          products.forEach(p => {
            map[p.id] = p;
          });
          setProductMap(map);
        }
      } catch (err) {
        console.error('Failed to load product prices:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const computeSubtotal = (itemsList: MappedCartItem[]) => {
    return itemsList.reduce((s, it) => {
      const price = productMap[it.id]?.price ?? it.price ?? 0;
      return s + price * it.amount;
    }, 0);
  };

  const subtotal = computeSubtotal(items);
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  const addItem = async (id: string, name: string, quantity: number = 1) => {
    if (!user) {
      toast.error('Please log in to add items to your cart');
      router.push('/login');
      return;
    }

    // Validate quantity against product stock
    const product = productMap[id];
    if (product?.stock !== undefined && quantity > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }

    setLoading(true);
    try {
      await cartService.addItem({ productId: id, amount: quantity });
      await fetchCart();
      toast.success(quantity > 1 ? `Added ${quantity} items to cart` : 'Added to cart');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to add to cart';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    setLoading(true);
    try {
      const item = items.find(i => i.id === id);
      if (item) {
        await cartService.removeItem(item.cartItemId);
        await fetchCart();
        toast('Removed from cart');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to remove item';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const item = items.find(i => i.id === id);
    if (!item) return;

    const product = productMap[id];
    if (product?.stock !== undefined && newQty > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }

    setLoading(true);
    try {
      await cartService.removeItem(item.cartItemId);
      await cartService.addItem({ productId: id, amount: newQty });
      await fetchCart();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update quantity';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    setLoading(true);
    try {
      const productIds = items.map(i => i.id);
      // Collect category IDs from all products in cart
      const categoryIds = new Set<string>();
      items.forEach(item => {
        const product = productMap[item.id];
        if (product?.categories) {
          product.categories.forEach(c => categoryIds.add(c.id));
        }
      });

      const result = await couponsService.validate(
        code,
        subtotal,
        productIds,
        Array.from(categoryIds)
      );
      if (result.coupon) {
        const couponType = result.coupon.type === CouponType.PERCENT ? 'percent' : 'amount';
        setCoupon({
          code: result.coupon.code,
          type: couponType,
          value: result.coupon.value
        });

        // Calculate discount
        let discountAmount = 0;
        if (couponType === 'amount') {
          discountAmount = result.coupon.value;
        } else if (couponType === 'percent') {
          discountAmount = (subtotal * result.coupon.value) / 100;
        }

        setDiscount(discountAmount);
        toast.success("Coupon applied!");
        return { success: true };
      } else {
        toast.error("Invalid coupon code");
        return { success: false, reason: 'invalid' };
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to validate coupon";
      toast.error(message);
      return { success: false, reason: 'network' };
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
    toast('Coupon removed');
  };

  const value: CartContextType = {
    items,
    count: items.reduce((s, it) => s + it.amount, 0),
    loading,
    error,
    subtotal,
    discount,
    total,
    coupon,
    refresh: fetchCart,
    addItem,
    removeItem,
    updateQuantity,
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
