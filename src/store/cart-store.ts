"use client";
import { create } from "zustand";
import { cartService } from "@/services/cart.service";
import { productsService } from "@/services/products.service";
import { couponsService } from "@/services/coupons.service";
import { useAuthStore } from "@/store/auth-store";
import { useTenantStore } from "@/store/tenant-store";
import { ApiError } from "@/lib/api-client";
import { Product } from "@/types/product.types";
import { CouponType, type Coupon } from "@/types/coupon.types";

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
  isReward?: boolean;
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

type CartPricingState = Pick<CartState, "items" | "productMap">;

type CouponValidationOutcome =
  | { success: true; coupon: NonNullable<ContextCoupon>; discount: number }
  | { success: false; reason: string };

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function getCartPricing(state: CartPricingState) {
  const productIds = state.items.map((item) => item.id);
  const categoryIds = new Set<string>();

  state.items.forEach((item) => {
    const product = state.productMap[item.id];
    product?.categories?.forEach((category) => categoryIds.add(category.id));
  });

  const rawSubtotal = state.items.reduce((sum, item) => {
    const price = state.productMap[item.id]?.price ?? item.price ?? 0;
    return sum + price * item.amount;
  }, 0);
  const subtotal = roundCurrency(Math.max(0, Number.isFinite(rawSubtotal) ? rawSubtotal : 0));

  return {
    subtotal,
    productIds,
    categoryIds: Array.from(categoryIds),
  };
}

function normalizeDiscount(value: number | undefined, subtotal: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return roundCurrency(Math.min(subtotal, Math.max(0, value)));
}

function toContextCoupon(coupon: Coupon, previous?: ContextCoupon): NonNullable<ContextCoupon> {
  const isReward = coupon.isReward ?? previous?.isReward;
  return {
    code: coupon.code,
    type: coupon.type === CouponType.PERCENT ? "percent" : "amount",
    value: coupon.value,
    ...(isReward === undefined ? {} : { isReward }),
  };
}

function extractErrorMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = extractErrorMessage(entry);
      if (message) return message;
    }
    return undefined;
  }
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  for (const key of ["errors", "error", "message", "messages", "data", "body", "response"]) {
    const message = extractErrorMessage(record[key]);
    if (message) return message;
  }
  return undefined;
}

function getValidationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return extractErrorMessage(error.errors) ?? (error.message || fallback);
  }
  return extractErrorMessage(error) ?? fallback;
}

async function validateCoupon(
  state: CartPricingState,
  code: string,
  previous?: ContextCoupon,
): Promise<CouponValidationOutcome> {
  const { subtotal, productIds, categoryIds } = getCartPricing(state);
  try {
    const result = await couponsService.validate(
      code,
      subtotal,
      productIds,
      categoryIds,
    );

    if (!result.valid || !result.coupon) {
      return { success: false, reason: result.message || "invalid" };
    }

    const discount = normalizeDiscount(result.discountAmount, subtotal);
    if (discount === null) {
      return { success: false, reason: result.message || "invalid" };
    }

    return {
      success: true,
      coupon: toContextCoupon(result.coupon, previous),
      discount,
    };
  } catch (error) {
    return {
      success: false,
      reason: getValidationErrorMessage(error, "Failed to validate coupon"),
    };
  }
}

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
      set({ items: [], loading: false, coupon: null, discount: 0 });
      return;
    }

    set({ loading: true, error: null });
    try {
      const response = await cartService.get();
      const cart = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.items)
          ? (response as any).items
          : Array.isArray((response as any)?.cart)
            ? (response as any).cart
            : Array.isArray((response as any)?.products)
              ? (response as any).products
              : [];
      const mappedItems: MappedCartItem[] = cart.map((item: any) => ({
          id: item.productId ?? item.id,
          cartItemId: item.id,
          name: item.name || "Unknown",
          amount: item.amount,
          price: item.price,
          image: item.image || undefined,
          stock: item.stock,
        }));

      set({ items: mappedItems });

      const appliedCoupon = get().coupon;
      if (appliedCoupon) {
        const validation = await validateCoupon(
          get(),
          appliedCoupon.code,
          appliedCoupon,
        );

        if (get().coupon?.code !== appliedCoupon.code) {
          set({ loading: false });
          return;
        }

        if (validation.success) {
          set({
            coupon: validation.coupon,
            discount: validation.discount,
          });
        } else {
          set({ coupon: null, discount: 0 });
        }
      }

      set({ loading: false });
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

  addItem: async (id, _name, quantity = 1) => {
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
      // Sequential remove+add: if the add fails we re-add the original item
      // so the cart is not left without the product.
      await cartService.removeItem(item.cartItemId);
      try {
        await cartService.addItem({ productId: id, amount: newQty });
      } catch (addErr) {
        await cartService.addItem({ productId: id, amount: item.amount });
        throw addErr;
      }
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
    set({ coupon: null, discount: 0, loading: true, error: null });
    const outcome = await validateCoupon(get(), code);

    if (!outcome.success) {
      set({ coupon: null, discount: 0, loading: false });
      return { success: false, reason: outcome.reason };
    }

    set({
      coupon: outcome.coupon,
      discount: outcome.discount,
      loading: false,
    });
    return { success: true };
  },

  removeCoupon: () => {
    set({ coupon: null, discount: 0 });
  },
}));
