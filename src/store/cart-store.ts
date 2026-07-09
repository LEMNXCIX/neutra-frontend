"use client";
import { create } from "zustand";
import { cartService } from "@/services/cart.service";
import { productsService } from "@/services/products.service";
import { couponsService } from "@/services/coupons.service";
import { useAuthStore } from "@/store/auth-store";
import { useTenantStore } from "@/store/tenant-store";
import { ApiError } from "@/lib/api-client";
import { Product } from "@/types/product.types";
import { CouponType } from "@/types/coupon.types";

export type MappedCartItem = {
  id: string;
  cartItemId: string;
  name: string;
  amount: number;
  price?: number;
  image?: string;
  stock?: number;
};

export type ContextCoupon = {
  code: string;
  type: "amount" | "percent";
  value: number;
} | null;

type CartState = {
  items: MappedCartItem[];
  loading: boolean;
  error: string | null;
  coupon: ContextCoupon;
  discount: number;
  productMap: Record<string, Product>;
};

type CartActions = {
  fetchCart: () => Promise<void>;
  loadProductMap: () => Promise<void>;
  addItem: (id: string, name: string, quantity?: number) => Promise<{ success: boolean; needsLogin?: boolean; reason?: string }>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, newQty: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; reason?: string }>;
  removeCoupon: () => void;
};

export const useCartStore = create<CartState & CartActions>()((set, get) => ({
  items: [],
  loading: false,
  error: null,
  coupon: null,
  discount: 0,
  productMap: {},

  fetchCart: async () => {
    const user = useAuthStore.getState().user;
    const moduleType = useTenantStore.getState().moduleType;

    if (!user || moduleType?.toUpperCase() !== "STORE") {
      set({ items: [], loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const cart = await cartService.get();
      const mappedItems: MappedCartItem[] =
        cart?.map((item) => ({
          id: item.id,
          cartItemId: item.id,
          name: item.name || "Unknown",
          amount: item.amount,
          price: item.price,
          image: item.image || undefined,
          stock: item.stock,
        })) ?? [];

      set({ items: mappedItems, loading: false });
    } catch (err) {
      const errorMsg =
        err instanceof ApiError ? err.message : "Failed to fetch cart";
      set({ error: errorMsg, loading: false });
      console.error("Cart fetch error:", err);
    }
  },

  loadProductMap: async () => {
    const moduleType = useTenantStore.getState().moduleType;
    if (moduleType?.toUpperCase() !== "STORE") return;

    try {
      const products = await productsService.getAll();
      const map: Record<string, Product> = {};
      products.forEach((p) => {
        map[p.id] = p;
      });
      set({ productMap: map });
    } catch (err) {
      console.error("Failed to load product prices:", err);
    }
  },

  addItem: async (id, name, quantity = 1) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      return { success: false, needsLogin: true };
    }

    const state = get();
    const product = state.productMap[id];
    if (product?.stock !== undefined && quantity > product.stock) {
      return { success: false, reason: `Only ${product.stock} items available in stock` };
    }

    set({ loading: true });
    try {
      await cartService.addItem({ productId: id, amount: quantity });
      await get().fetchCart();
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to add to cart";
      set({ loading: false });
      return { success: false, reason: message };
    }
  },

  removeItem: async (id) => {
    set({ loading: true });
    try {
      const item = get().items.find((i) => i.id === id);
      if (item) {
        await cartService.removeItem(item.cartItemId);
        await get().fetchCart();
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to remove item";
      console.error(message);
    } finally {
      set({ loading: false });
    }
  },

  updateQuantity: async (id, newQty) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const product = get().productMap[id];
    if (product?.stock !== undefined && newQty > product.stock) {
      return;
    }

    set({ loading: true });
    try {
      await Promise.all([
        cartService.removeItem(item.cartItemId),
        cartService.addItem({ productId: id, amount: newQty }),
      ]);
      await get().fetchCart();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to update quantity";
      console.error(message);
    } finally {
      set({ loading: false });
    }
  },

  applyCoupon: async (code) => {
    set({ loading: true });
    const state = get();
    try {
      const productIds = state.items.map((i) => i.id);
      const categoryIds = new Set<string>();
      state.items.forEach((item) => {
        const product = state.productMap[item.id];
        if (product?.categories) {
          product.categories.forEach((c) => categoryIds.add(c.id));
        }
      });

      const subtotal = state.items.reduce((s, it) => {
        const price = state.productMap[it.id]?.price ?? it.price ?? 0;
        return s + price * it.amount;
      }, 0);

      const result = await couponsService.validate(
        code,
        subtotal,
        productIds,
        Array.from(categoryIds),
      );

      if (result.coupon) {
        const couponType =
          result.coupon.type === CouponType.PERCENT
            ? "percent"
            : "amount";

        let discountAmount = 0;
        if (couponType === "amount") {
          discountAmount = result.coupon.value;
        } else if (couponType === "percent") {
          discountAmount = (subtotal * result.coupon.value) / 100;
        }

        set({
          coupon: {
            code: result.coupon.code,
            type: couponType,
            value: result.coupon.value,
          },
          discount: discountAmount,
          loading: false,
        });
        return { success: true };
      }

      set({ loading: false });
      return { success: false, reason: "invalid" };
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to validate coupon";
      set({ loading: false });
      return { success: false, reason: message };
    }
  },

  removeCoupon: () => {
    set({ coupon: null, discount: 0 });
  },
}));
