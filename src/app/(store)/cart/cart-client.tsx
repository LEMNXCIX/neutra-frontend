"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useFeatures } from "@/hooks/useFeatures";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Trash2,
  Loader2,
  ShoppingBag,
  Plus,
  Minus,
  Tag,
  MapPin,
  CreditCard,
  Percent,
  DollarSign,
  ShoppingCart,
  Package,
} from "lucide-react";
import Image from "@/components/ui/image";

export default function CartClient() {
  const {
    items,
    removeItem,
    updateQuantity,
    loading,
    refresh,
    applyCoupon,
    removeCoupon,
    coupon,
    discount,
    subtotal,
  } = useCart();
  const { isFeatureEnabled } = useFeatures();

  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [code, setCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const router = useRouter();

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setApplyingCoupon(true);
    try {
      await applyCoupon(code);
      setCode("");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCode("");
  };

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    if (typeof updateQuantity === 'function') {
      await updateQuantity(itemId, newQty);
    }
  };

  const placeOrder = async () => {
    if (items.length === 0) return toast.error("Cart is empty");
    if (!address.trim()) return toast.error("Enter delivery address");

    setPlacing(true);
    try {
      const bodyPayload = {
        items: items.map((i) => ({ id: i.id, amount: i.amount })),
        address,
        couponCode: coupon?.code || null,
      };

      const res = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed to place order");
        setPlacing(false);
        return;
      }

      await apiFetch("/api/cart/clear", { method: "DELETE" });
      await refresh();
      if (coupon) removeCoupon();

      setCode("");
      toast.success("Order placed successfully! 🎉");

      const orderId = data?.order?.id;
      router.push(orderId ? `/orders/${orderId}` : "/profile");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : String(err);
      toast.error(msg || "Unexpected error");
    } finally {
      setPlacing(false);
    }
  };

  const total = Math.max(0, subtotal - discount);
  const savings = discount;

  if (!items || items.length === 0)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-none shadow-lg">
          <CardContent className="pt-12 pb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven&apos;t added anything to your cart yet
            </p>
            <Button size="lg" onClick={() => router.push("/")}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4 animate-slide-up">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-3 flex items-center gap-4 text-foreground">
            <ShoppingCart className="h-10 w-10" strokeWidth={2.5} />
            Your <span className="text-primary">Basket</span>
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
            Review your {items.length === 1 ? 'selection' : `${items.length} selections`} before processing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
                {items.map((item) => {
                  const itemTotal = (item.price || 0) * item.amount;
                  return (
                    <Card
                      key={item.id}
                      className="group relative overflow-hidden border-border bg-card transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 rounded-2xl"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                          {/* Product Image */}
                          <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-muted rounded-xl overflow-hidden border border-border/50 group-hover:scale-105 transition-transform duration-500">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-xl mb-1 tracking-tight group-hover:text-primary transition-colors">
                                {item.name}
                                </h3>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                ${(item.price || 0).toFixed(2)} / unit
                                </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-background shadow-sm"
                                  onClick={() => handleQuantityChange(item.id, item.amount - 1)}
                                  disabled={loading || item.amount <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="w-10 text-center font-black text-sm">
                                  {item.amount}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-background shadow-sm"
                                  onClick={() => handleQuantityChange(item.id, item.amount + 1)}
                                  disabled={loading}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subtotal</p>
                                <p className="text-lg font-black italic tracking-tighter">${itemTotal.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <div className="absolute top-4 right-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              disabled={loading}
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Coupon Card */}
              {isFeatureEnabled("COUPONS") && (
                <Card className="border-border bg-card rounded-2xl shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      Promotion Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="flex-1 h-11 border-2 font-black uppercase tracking-widest text-xs rounded-xl"
                        disabled={!!coupon}
                      />
                      {!coupon ? (
                        <Button
                          onClick={handleApplyCoupon}
                          disabled={applyingCoupon || !code.trim()}
                          className="h-11 px-6 rounded-xl font-black uppercase text-xs tracking-widest"
                        >
                          {applyingCoupon ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={handleRemoveCoupon} className="h-11 rounded-xl font-black uppercase text-xs border-2">
                          Clear
                        </Button>
                      )}
                    </div>
                    {coupon && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 animate-in zoom-in-95">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500 text-white rounded-lg">
                            {coupon.type === "percent" ? <Percent size={14} strokeWidth={3} /> : <DollarSign size={14} strokeWidth={3} />}
                          </div>
                          <div>
                            <p className="font-black text-xs text-emerald-700 uppercase tracking-widest">
                              {coupon.code} Applied
                            </p>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                              {coupon.type === "percent"
                                ? `${coupon.value}% Discount Applied`
                                : `$${coupon.value.toFixed(2)} Off Total`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Address Card */}
              <Card className="border-border bg-card rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Delivery Target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="FULL SHIPPING ADDRESS"
                    className="w-full h-11 border-2 font-bold text-sm rounded-xl"
                  />
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card className="border-none bg-foreground text-background rounded-2xl shadow-2xl overflow-hidden">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60">
                    <CreditCard className="h-4 w-4" />
                    Final Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-70">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Adjustment
                        </span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="h-px bg-background/20" />
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Total Amount</span>
                        <span className="text-4xl font-black italic tracking-tighter">${total.toFixed(2)}</span>
                    </div>
                    {savings > 0 && (
                      <div className="pt-2">
                        <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                Total Saved: ${savings.toFixed(2)}
                            </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pb-8">
                  <Button
                    className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] bg-background text-foreground hover:bg-background/90 rounded-xl transition-all hover:scale-105 active:scale-95"
                    onClick={placeOrder}
                    disabled={placing || loading || !address.trim()}
                    size="lg"
                  >
                    {placing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        Processing
                      </>
                    ) : (
                      <>
                        Process Order →
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
