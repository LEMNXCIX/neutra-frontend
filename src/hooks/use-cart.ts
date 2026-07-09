"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";

export function useCart() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const store = useCartStore();

  useEffect(() => {
    store.fetchCart();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    store.loadProductMap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const count = store.items.reduce((s, it) => s + it.amount, 0);

  const subtotal = store.items.reduce((s, it) => {
    const price = store.productMap[it.id]?.price ?? it.price ?? 0;
    return s + price * it.amount;
  }, 0);

  const total = Math.max(
    0,
    Math.round((subtotal - store.discount) * 100) / 100,
  );

  const addItem = async (id: string, name: string, quantity?: number) => {
    const result = await store.addItem(id, name, quantity);
    if (result.needsLogin) {
      toast.error("Please log in to add items to your cart");
      router.push("/login");
      return;
    }
    if (!result.success) {
      toast.error(result.reason || "Failed to add to cart");
      return;
    }
    const qty = quantity ?? 1;
    toast.success(
      qty > 1 ? `Added ${qty} items to cart` : "Added to cart",
    );
  };

  const removeItem = async (id: string) => {
    await store.removeItem(id);
    toast("Removed from cart");
  };

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const item = store.items.find((i) => i.id === id);
    const product = store.productMap[id];
    if (product?.stock !== undefined && newQty > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }
    if (!item) return;

    await store.updateQuantity(id, newQty);
  };

  const applyCoupon = async (code: string) => {
    const result = await store.applyCoupon(code);
    if (result.success) {
      toast.success("Coupon applied!");
    } else {
      toast.error("Invalid coupon code");
    }
    return result;
  };

  const removeCoupon = () => {
    store.removeCoupon();
    toast("Coupon removed");
  };

  return {
    items: store.items,
    count,
    loading: store.loading,
    error: store.error,
    subtotal,
    discount: store.discount,
    total,
    coupon: store.coupon,
    refresh: store.fetchCart,
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
  };
}
