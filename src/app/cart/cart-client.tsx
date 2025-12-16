"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Cart Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => {
                  const itemTotal = (item.price || 0) * item.amount;
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          ${(item.price || 0).toFixed(2)} each
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => handleQuantityChange(item.id, item.amount - 1)}
                              disabled={loading || item.amount <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-12 text-center font-medium">
                              {item.amount}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => handleQuantityChange(item.id, item.amount + 1)}
                              disabled={loading}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Total: <strong className="text-foreground">${itemTotal.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={loading}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Coupon Card */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="h-5 w-5" />
                    Promo Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      className="flex-1"
                      disabled={!!coupon}
                    />
                    {!coupon ? (
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !code.trim()}
                      >
                        {applyingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={handleRemoveCoupon}>
                        Remove
                      </Button>
                    )}
                  </div>
                  {coupon && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-start gap-2">
                        {coupon.type === "percent" ? (
                          <Percent className="h-4 w-4 text-green-600 mt-0.5" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-green-700">
                            {coupon.code}
                          </p>
                          <p className="text-xs text-green-600">
                            {coupon.type === "percent"
                              ? `${coupon.value}% discount`
                              : `$${coupon.value.toFixed(2)} off`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address Card */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your delivery address"
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Discount
                        </span>
                        <span className="font-medium">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    {savings > 0 && (
                      <Badge variant="secondary" className="w-full justify-center bg-green-500/10 text-green-700 hover:bg-green-500/20">
                        You save ${savings.toFixed(2)}!
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full h-12 text-lg font-semibold"
                    onClick={placeOrder}
                    disabled={placing || loading || !address.trim()}
                    size="lg"
                  >
                    {placing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Place Order
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
