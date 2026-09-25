"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
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
    Gift,
} from "lucide-react";
import Image from "@/components/ui/image";
import type { ContextCoupon } from "@/store/cart-store";

function getBackendMessage(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
        for (const entry of value) {
            const message = getBackendMessage(entry, "");
            if (message) return message;
        }
        return fallback;
    }
    if (!value || typeof value !== "object") return fallback;

    const record = value as Record<string, unknown>;
    for (const key of ["errors", "error", "message", "messages", "data", "body", "response"]) {
        const message = getBackendMessage(record[key], "");
        if (message) return message;
    }
    return fallback;
}

type CartItem = {
  id: string;
  name: string;
  price?: number;
  amount: number;
  image?: string;
};

function CartItemCard({
  item,
  loading,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  loading: boolean;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const itemTotal = (item.price || 0) * item.amount;
  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 rounded-xl">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-muted rounded-xl overflow-hidden border border-border/50 group-hover:scale-105 transition-transform duration-500">
            {item.image ? (
              <Image src={item.image} alt={item.name} width={128} height={128} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="size-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xl mb-1 tracking-tight group-hover:text-primary transition-colors">{item.name}</h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                ${(item.price || 0).toFixed(2)} / unidad
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50">
                <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-background shadow-sm" onClick={() => onQuantityChange(item.id, item.amount - 1)} disabled={loading || item.amount <= 1}>
                  <Minus className="size-3" />
                </Button>
                <div className="w-10 text-center font-black text-sm">{item.amount}</div>
                <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-background shadow-sm" onClick={() => onQuantityChange(item.id, item.amount + 1)} disabled={loading}>
                  <Plus className="size-3" />
                </Button>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subtotal</p>
                <p className="text-lg font-black italic tracking-tighter">${itemTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} disabled={loading} className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CouponCard({
  code,
  onCodeChange,
  onApply,
  onRemove,
  coupon,
  discount,
  applyingCoupon,
}: {
  code: string;
  onCodeChange: (v: string) => void;
  onApply: () => void;
  onRemove: () => void;
  coupon: ContextCoupon;
  discount: number;
  applyingCoupon: boolean;
}) {
  return (
    <Card className="border-border bg-card rounded-xl shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
          <Tag className="size-4" /> Código de promoción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            placeholder="INGRESÁ CÓDIGO"
            className="flex-1 h-11 border-2 font-black uppercase tracking-widest text-xs rounded-xl"
            disabled={!!coupon}
          />
          {!coupon ? (
            <Button onClick={onApply} disabled={applyingCoupon || !code.trim()} className="h-11 px-6 rounded-xl font-black uppercase text-xs tracking-widest">
              {applyingCoupon ? <Loader2 className="size-4 animate-spin" /> : "Aplicar"}
            </Button>
          ) : (
            <Button variant="outline" onClick={onRemove} className="h-11 rounded-xl font-black uppercase text-xs border-2">Vaciar</Button>
          )}
        </div>
        {coupon && (
          <div
            className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 animate-in zoom-in-95"
            aria-label={coupon.isReward ? "Cupón de recompensa aplicado" : "Cupón aplicado"}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                {coupon.type === "percent" ? <Percent size={14} strokeWidth={3} /> : <DollarSign size={14} strokeWidth={3} />}
              </div>
              <div>
                {coupon.isReward && (
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest">
                    <Gift size={12} strokeWidth={3} aria-hidden="true" />
                    Recompensa de fidelización
                  </p>
                )}
                <p className="font-black text-xs text-emerald-700 uppercase tracking-widest">{coupon.code} aplicado</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                  {coupon.type === "percent"
                    ? `${coupon.value}% de descuento aplicado · $${discount.toFixed(2)}`
                    : `$${discount.toFixed(2)} de descuento total`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderSummaryCard({
  subtotal,
  discount,
  total,
  savings,
  placing,
  loading,
  addressEmpty,
  onPlaceOrder,
}: {
  subtotal: number;
  discount: number;
  total: number;
  savings: number;
  placing: boolean;
  loading: boolean;
  addressEmpty: boolean;
  onPlaceOrder: () => void;
}) {
  return (
    <Card className="border-none bg-card text-card-foreground rounded-xl shadow-2xl overflow-hidden">
      <div className="h-2 bg-primary w-full" />
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60">
          <CreditCard className="size-4" /> Resumen final
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
              <span className="flex items-center gap-1"><Tag className="size-3" /> Ajuste</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="h-px bg-border" />
          <div className="flex justify-between items-end">
            <span className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Total</span>
            <span className="text-4xl font-black italic tracking-tighter">${total.toFixed(2)}</span>
          </div>
          {savings > 0 && (
            <div className="pt-2">
              <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total ahorrado: ${savings.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pb-8">
        <Button
          className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all hover:scale-105 active:scale-95"
          onClick={onPlaceOrder}
          disabled={placing || loading || addressEmpty}
          size="lg"
        >
          {placing ? <><Loader2 className="size-5 animate-spin mr-3" /> Procesando</> : <>Realizar pedido →</>}
        </Button>
      </CardFooter>
    </Card>
  );
}

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
            toast.error("Ingresá un código de cupón");
            return;
        }
        setApplyingCoupon(true);
        try {
            const result = await applyCoupon(code);
            if (result.success) setCode("");
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
        if (typeof updateQuantity === "function") {
            await updateQuantity(itemId, newQty);
        }
    };

    const placeOrder = async () => {
        if (items.length === 0) return toast.error("El carrito está vacío");
        if (!address.trim()) return toast.error("Ingresá la dirección de envío");

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
                toast.error(
                    getBackendMessage(data, "Error al realizar el pedido"),
                );
                setPlacing(false);
                return;
            }

            await apiFetch("/api/cart/clear", { method: "DELETE" });
            await refresh();
            if (coupon) removeCoupon();

            setCode("");
            toast.success("¡Pedido realizado correctamente! 🎉");

            const orderId = data?.order?.id;
            router.push(orderId ? `/orders/${orderId}` : "/profile");
        } catch (err: unknown) {
            toast.error(getBackendMessage(err, "Error inesperado"));
        } finally {
            setPlacing(false);
        }
    };

    const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
    const savings = discount;

    if (!items || items.length === 0)
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center border-none shadow-lg">
                    <CardContent className="pt-12 pb-8">
                        <div className="size-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                            <ShoppingBag className="size-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                            Tu carrito está vacío
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Parece que todavía no agregaste productos a tu carrito
                        </p>
                        <Button size="lg" onClick={() => router.push("/")}>
                            <ShoppingBag className="mr-2 size-5" />
                            Comenzar a comprar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );

    return (
        <div className="min-h-screen bg-background py-12 px-4 animate-slide-up">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-3 flex items-center gap-4 text-foreground">
                        <ShoppingCart className="size-10" strokeWidth={2.5} />
                        Tu <span className="text-primary">carrito</span>
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                        Revisá tu{" "}
                        {items.length === 1
                            ? "selección"
                            : `${items.length} selecciones`}{" "}
                        antes de continuar
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} loading={loading} onQuantityChange={handleQuantityChange} onRemove={removeItem} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {isFeatureEnabled("COUPONS") && (
              <CouponCard
                code={code}
                onCodeChange={setCode}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
                coupon={coupon}
                discount={discount}
                applyingCoupon={applyingCoupon}
              />
            )}

            <Card className="border-border bg-card rounded-xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <MapPin className="size-4" /> Dirección de envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="DIRECCIÓN COMPLETA DE ENVÍO"
                  className="w-full h-11 border-2 font-bold text-sm rounded-xl"
                />
              </CardContent>
            </Card>

            <OrderSummaryCard
              subtotal={subtotal}
              discount={discount}
              total={total}
              savings={savings}
              placing={placing}
              loading={loading}
              addressEmpty={!address.trim()}
              onPlaceOrder={placeOrder}
            />
          </div>
        </div>
                </div>
            </div>
        </div>
    );
}
