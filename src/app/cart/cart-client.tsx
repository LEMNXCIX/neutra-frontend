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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Trash, Loader2 } from "lucide-react";

export default function CartClient() {
  const {
    items,
    removeItem,
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
  const router = useRouter();

  const placeOrder = async () => {
    if (items.length === 0) return toast.error("Cart is empty");
    if (!address.trim()) return toast.error("Enter delivery address");

    setPlacing(true);
    try {
      const bodyPayload = {
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
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

      await apiFetch("/api/cart", { method: "DELETE" });
      await refresh();
      if (coupon) removeCoupon();

      setCode("");
      toast.success("Order placed successfully");

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

  if (!items || items.length === 0)
    return (
      <Card className="mx-auto max-w-md mt-10 text-center p-6">
        <CardContent>
          <p className="text-muted-foreground mb-3">Your cart is empty.</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go Shopping
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Card className="shadow-sm border border-muted/30">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Your Cart</CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="max-h-[350px] pr-2">
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3 hover:bg-muted/40 transition"
                >
                  <div>
                    <p className="font-medium text-sm sm:text-base">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {it.qty}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(it.id)}
                      disabled={loading}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>

          <Separator className="my-5" />

          {/* Coupon */}
          <div className="mb-5">
            <Label htmlFor="coupon" className="text-sm mb-1 block">
              Coupon
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!code) return;
                  await applyCoupon(code);
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
              {coupon && (
                <Button variant="outline" onClick={() => removeCoupon()}>
                  Remove
                </Button>
              )}
            </div>
            {coupon && (
              <p className="text-xs mt-2">
                Applied: <strong>{coupon.code}</strong> —{" "}
                {coupon.type === "percent"
                  ? `${coupon.value}% off`
                  : `$${coupon.value.toFixed(2)}`}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="mb-4">
            <Label htmlFor="address" className="text-sm mb-1 block">
              Delivery address
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, etc."
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col text-sm text-muted-foreground w-full sm:w-auto">
            <span>
              Subtotal: <strong>${subtotal.toFixed(2)}</strong>
            </span>
            <span>
              Discount: <strong>-${discount.toFixed(2)}</strong>
            </span>
            <span className="text-foreground font-semibold mt-1">
              Total: ${(Math.max(0, subtotal - discount)).toFixed(2)}
            </span>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={placeOrder}
            disabled={placing || loading}
          >
            {placing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {placing ? "Placing..." : "Place Order"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
