"use client";
import React, { createContext, use, useEffect, useReducer } from "react";
import { cartService } from "@/services/cart.service";
import { productsService } from "@/services/products.service";
import { couponsService } from "@/services/coupons.service";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useTenant } from "./tenant-context";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { Product } from "@/types/product.types";
import { CouponType } from "@/types/coupon.types";

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
    type: "amount" | "percent";
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
    applyCoupon: (
        code: string,
    ) => Promise<{ success: boolean; reason?: string }>;
    removeCoupon: () => void;
};

type CartState = {
  items: MappedCartItem[];
  loading: boolean;
  error: string | null;
  coupon: ContextCoupon;
  discount: number;
  productMap: Record<string, Product>;
};

type CartAction =
  | { type: "SET_ITEMS"; payload: MappedCartItem[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_COUPON"; payload: ContextCoupon }
  | { type: "SET_DISCOUNT"; payload: number }
  | { type: "SET_PRODUCT_MAP"; payload: Record<string, Product> };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_COUPON":
      return { ...state, coupon: action.payload };
    case "SET_DISCOUNT":
      return { ...state, discount: action.payload };
    case "SET_PRODUCT_MAP":
      return { ...state, productMap: action.payload };
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    loading: false,
    error: null,
    coupon: null,
    discount: 0,
    productMap: {},
  });

    const user = useAuthStore((s) => s.user);
    const router = useRouter();
    const { moduleType } = useTenant();

    const fetchCart = React.useCallback(async () => {
        if (!user || moduleType?.toUpperCase() !== "STORE") {
    dispatch({ type: "SET_ITEMS", payload: [] });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
        try {
            const cart = await cartService.get();

            const mappedItems: MappedCartItem[] =
                cart?.map((item) => {
                    return {
                        id: item.id,
                        cartItemId: item.id,
                        name: item.name || "Unknown",
                        amount: item.amount,
                        price: item.price,
                        image: item.image || undefined,
                        stock: item.stock,
                    };
                }) ?? [];

            dispatch({ type: "SET_ITEMS", payload: mappedItems });
        } catch (err) {
            const errorMsg =
                err instanceof ApiError ? err.message : "Failed to fetch cart";
            dispatch({ type: "SET_ERROR", payload: errorMsg });
            console.error("❌ Cart fetch error:", err);
        } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
}, [user, moduleType]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

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
          dispatch({ type: "SET_PRODUCT_MAP", payload: map });
        }
      } catch (err) {
        console.error('Failed to load product prices:', err);
      }
    })();
    return () => { mounted = false; };
  }, [moduleType]);

    const computeSubtotal = (itemsList: MappedCartItem[]) => {
        return itemsList.reduce((s, it) => {
            const price = state.productMap[it.id]?.price ?? it.price ?? 0;
            return s + price * it.amount;
        }, 0);
    };

  const subtotal = computeSubtotal(state.items);
  const total = Math.max(0, Math.round((subtotal - state.discount) * 100) / 100);

    const addItem = async (id: string, name: string, quantity: number = 1) => {
        if (!user) {
            toast.error("Please log in to add items to your cart");
            router.push("/login");
            return;
        }

          const product = state.productMap[id];
  if (product?.stock !== undefined && quantity > product.stock) {
    toast.error(`Only ${product.stock} items available in stock`);
    return;
  }

  dispatch({ type: "SET_LOADING", payload: true });
        try {
            await cartService.addItem({ productId: id, amount: quantity });
            await fetchCart();
            toast.success(
                quantity > 1
                    ? `Added ${quantity} items to cart`
                    : "Added to cart",
            );
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : "Failed to add to cart";
            toast.error(message);
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

const removeItem = async (id: string) => {
  dispatch({ type: "SET_LOADING", payload: true });
        try {
    const item = state.items.find((i) => i.id === id);
            if (item) {
                await cartService.removeItem(item.cartItemId);
                await fetchCart();
                toast("Removed from cart");
            }
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : "Failed to remove item";
            toast.error(message);
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

const updateQuantity = async (id: string, newQty: number) => {
        if (newQty < 1) {
            toast.error("Quantity must be at least 1");
            return;
        }

  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  const product = state.productMap[id];
        if (product?.stock !== undefined && newQty > product.stock) {
            toast.error(`Only ${product.stock} items available in stock`);
            return;
        }

  dispatch({ type: "SET_LOADING", payload: true });
  try {
    await Promise.all([
      cartService.removeItem(item.cartItemId),
      cartService.addItem({ productId: id, amount: newQty }),
    ]);
    await fetchCart();
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : "Failed to update quantity";
    toast.error(message);
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

const applyCoupon = async (code: string) => {
  dispatch({ type: "SET_LOADING", payload: true });
        try {
    const productIds = state.items.map((i) => i.id);
    const categoryIds = new Set<string>();
    state.items.forEach((item) => {
      const product = state.productMap[item.id];
                if (product?.categories) {
                    product.categories.forEach((c) => categoryIds.add(c.id));
                }
            });

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
      dispatch({ type: "SET_COUPON", payload: {
        code: result.coupon.code,
        type: couponType,
        value: result.coupon.value,
      }});

      let discountAmount = 0;
                if (couponType === "amount") {
                    discountAmount = result.coupon.value;
                } else if (couponType === "percent") {
                    discountAmount = (subtotal * result.coupon.value) / 100;
                }

                dispatch({ type: "SET_DISCOUNT", payload: discountAmount });
                toast.success("Coupon applied!");
                return { success: true };
            } else {
                toast.error("Invalid coupon code");
                return { success: false, reason: "invalid" };
            }
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : "Failed to validate coupon";
            toast.error(message);
            return { success: false, reason: "network" };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

const removeCoupon = () => {
  dispatch({ type: "SET_COUPON", payload: null });
  dispatch({ type: "SET_DISCOUNT", payload: 0 });
        toast("Coupon removed");
    };

  const value: CartContextType = {
    items: state.items,
    count: state.items.reduce((s, it) => s + it.amount, 0),
    loading: state.loading,
    error: state.error,
    subtotal,
    discount: state.discount,
    total,
    coupon: state.coupon,
        refresh: fetchCart,
        addItem,
        removeItem,
        updateQuantity,
        applyCoupon,
        removeCoupon,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};

export function useCart() {
    const ctx = use(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
