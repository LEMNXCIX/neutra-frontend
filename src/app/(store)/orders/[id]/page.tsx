import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from '@/lib/api-client';

export const metadata: Metadata = {
    title: "Detalles del Pedido",
    description: "Ver el estado y los detalles de tu pedido",
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    Truck,
    MapPin,
    CreditCard,
    ArrowLeft,
    CheckCircle2,
    Clock,
    XCircle,
    Tag,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PrintReceiptButton } from "@/components/print-receipt-button";

type OrderItem = { id: string; name: string; qty: number; price: number };
type Order = {
  id: string;
  userId: string;
  total: number;
  status: string;
  trackingNumber?: string;
  address: string;
  items: OrderItem[];
  date: string;
  couponCode?: string;
  discount?: number;
};

function OrderItemsSection({ items }: { items: OrderItem[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
          <Package
            size={18}
            className="text-primary"
          />{" "}
          Artículos del pedido
        </h3>
        <div className="h-px flex-1 bg-border/30" />
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const itemTotal = item.price * item.qty;
          return (
            <Card
              key={item.id}
              className="group border-none shadow-lg hover:shadow-2xl transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-500 rounded-xl overflow-hidden bg-background"
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="bg-muted px-3 py-1 rounded-full">
                        Cantidad:{" "}
                        {item.qty}
                      </span>
                      <span className="bg-muted px-3 py-1 rounded-full">
                        Precio: ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      ${itemTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function OrderPricingSummary({ subtotal, discount, couponCode, total }: { subtotal: number; discount: number; couponCode?: string; total: number }) {
  return (
    <div className="p-10 bg-muted/30 backdrop-blur-sm border border-border/50 rounded-[2.5rem] space-y-6 shadow-inner">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
          <span>Subtotal</span>
          <span className="text-foreground">
            ${subtotal.toFixed(2)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-emerald-600">
            <span className="flex items-center gap-2">
              <Tag size={16} /> Descuento{" "}
              {couponCode && `(${couponCode})`}
            </span>
            <span>
              -${discount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
          <span>Envío</span>
          <span className="text-foreground">
            Se calcula al finalizar la compra
          </span>
        </div>
      </div>
      <div className="h-px bg-border/50" />
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Total
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-muted-foreground uppercase">
              USD
            </span>
            <span className="text-6xl font-bold tracking-tight text-foreground">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderInfoGrid({ address, trackingNumber }: { address: string; trackingNumber?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="border-none shadow-xl rounded-[2rem] bg-background group hover:shadow-2xl transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-500">
        <CardHeader className="pb-4">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-3">
            <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <MapPin size={16} />
            </div>
            Dirección de envío
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="font-bold text-xl leading-relaxed text-foreground/80">
            {address}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-[2rem] bg-background group hover:shadow-2xl transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-500">
        <CardHeader className="pb-4">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-purple-600 flex items-center gap-3">
            <div className="size-8 bg-purple-600/10 rounded-xl flex items-center justify-center">
              <Truck size={16} />
            </div>
            Información de seguimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          {trackingNumber ? (
            <div className="space-y-4">
              <div className="bg-muted/50 px-6 py-4 rounded-xl font-mono text-base font-bold tracking-tight border border-border/30 text-center">
                {trackingNumber}
              </div>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-foreground hover:text-background transition-[color,background-color,border-color,box-shadow,opacity,transform]"
              >
                Copiar número
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 gap-2 opacity-60">
              <Clock className="size-8 text-muted-foreground" />
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Preparando el envío
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrderTimeline({ orderDate, status }: { orderDate: string; status: string }) {
  const steps = [
    {
      label: "Pedido Realizado",
      date: orderDate,
      active: true,
    },
    {
      label: "En Tránsito",
      date:
        status === "shipped" || status === "delivered"
          ? "Enviado a destino"
          : "Procesándose en depósito",
      active: status === "shipped" || status === "delivered",
    },
    {
      label: "Entregado",
      date:
        status === "delivered"
          ? "Entrega final exitosa"
          : "Pronto disponible",
      active: status === "delivered",
    },
  ];

  return (
    <Card className="border-none shadow-2xl rounded-[2rem] bg-background overflow-hidden">
      <CardHeader className="bg-muted/30 p-8 border-b border-border/50">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Seguimiento del pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-10">
        <div className="space-y-12 relative">
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-muted/50 z-0" />
          {steps.map((step) => (
            <div
              key={step.label}
              className="flex gap-8 relative z-10"
            >
              <div
                className={cn(
                  "size-5 rounded-full mt-1 border-4 transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-700",
                  step.active
                    ? "bg-primary border-primary/20 scale-125 shadow-lg shadow-primary/20"
                    : "bg-background border-muted",
                )}
              />
              <div className="space-y-2">
                <p
                  className={cn(
                    "font-bold uppercase text-[10px] tracking-widest",
                    step.active
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  {step.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderHelpCard() {
  return (
    <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-primary/5 to-purple-600/5 p-10 text-center space-y-8">
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
          ¿Necesitás ayuda?
        </p>
        <p className="text-base font-medium leading-relaxed text-muted-foreground">
          ¿Tenés dudas sobre tu pedido o necesitás solicitar una devolución?
        </p>
      </div>
      <Button
        variant="outline"
        className="w-full h-14 rounded-xl border-2 font-bold uppercase tracking-widest text-[10px] hover:bg-foreground hover:text-background transition-[color,background-color,border-color,box-shadow,opacity,transform]"
        asChild
      >
        <Link href="/contact">Contactar Soporte</Link>
      </Button>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const statusConfig: Record<
  string,
  { label: string; color: string; icon: any; description: string }
> = {
  processing: {
    label: "Procesando",
    color: "bg-yellow-500",
    icon: Clock,
    description: "Tu pedido se está preparando",
  },
  shipped: {
    label: "Enviado",
    color: "bg-blue-500",
    icon: Truck,
    description: "Tu pedido está en camino",
  },
  delivered: {
    label: "Entregado",
    color: "bg-green-500",
    icon: CheckCircle2,
    description: "Tu pedido fue entregado",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500",
    icon: XCircle,
    description: "Este pedido fue cancelado",
  },
  PAGADO: {
    label: "Pagado",
    color: "bg-blue-500",
    icon: CreditCard,
    description: "Pedido pagado y en proceso",
  },
};

export default async function OrderPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  let rawOrder;
  try {
    rawOrder = await api.get<any>(`/order/${params.id}`);
  } catch (error) {
    console.error("Error fetching order:", error);
    return notFound();
  }

  if (!rawOrder) return notFound();

        // Map API response to Order type
        const order: Order = {
            id: rawOrder.id,
            userId: rawOrder.userId,
            total: rawOrder.total,
            status: rawOrder.status,
            trackingNumber: rawOrder.trackingNumber,
            address: rawOrder.user?.email || "Dirección no disponible", // Fallback since address might not be in response
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            items:
                rawOrder.items?.map((item: any) => ({
                    id: item.id,
                    name: item.product?.name || "Producto desconocido",
                    qty: item.amount,
                    price: item.price,
                })) || [],
            date: new Date(rawOrder.createdAt).toLocaleDateString("es-ES", { timeZone: "UTC" }),
            couponCode: rawOrder.couponId,
            discount: rawOrder.discountAmount,
};

const currentStatus =
            statusConfig[order.status] || statusConfig.processing;
        const StatusIcon = currentStatus.icon;

        const subtotal = order.items.reduce(
            (sum: number, item: OrderItem) => sum + item.price * item.qty,
            0,
        );
        const discount = order.discount || 0;

        return (
            <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-16 px-6 animate-in fade-in duration-700">
                <div className="max-w-5xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/50 pb-10 print:hidden">
                        <div className="space-y-4">
                            <Button
                                variant="ghost"
                                asChild
                                className="group font-bold uppercase tracking-widest text-[10px] p-0 h-auto hover:bg-transparent rounded-xl transition-[color,background-color,border-color,box-shadow,opacity,transform]"
                            >
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2"
                                >
                                    <ArrowLeft
                                        className="size-4 transition-transform group-hover:-translate-x-1 text-primary"
                                        strokeWidth={3}
                                    />
                                    Volver al perfil
                                </Link>
                            </Button>
                            <div className="space-y-2">
                                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-none">
                                    Detalles del pedido
                                </h1>
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                                    ID del pedido: #{order.id}
                                </p>
                            </div>
                        </div>
                        <PrintReceiptButton />
                    </div>

                    {/* Status Card */}
                    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden relative group print:hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                        <CardContent className="p-8 md:p-12">
                            <div className="flex flex-col md:flex-row items-center gap-10">
                                <div
                                    className={cn(
                                        "p-8 rounded-[2rem] shadow-inner border border-border/50 flex items-center justify-center",
                                        currentStatus.color
                                            .replace("bg-", "bg-")
                                            .replace("500", "500/10"),
                                    )}
                                >
                                    <StatusIcon
                                        className={cn(
                                            "size-14",
                                            currentStatus.color.replace(
                                                "bg-",
                                                "text-",
                                            ),
                                        )}
                                        strokeWidth={2}
                                    />
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-3">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <h2 className="text-4xl font-bold tracking-tight text-foreground">
                                            {currentStatus.label}
                                        </h2>
                                        <Badge
                                            className={cn(
                                                "px-4 py-1.5 font-bold text-[10px] tracking-widest rounded-full uppercase border-none shadow-sm",
                                                currentStatus.color,
                                            )}
                                        >
                                            {currentStatus.label}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground font-medium text-lg max-w-md">
                                        {currentStatus.description}
                                    </p>
                                </div>
                                <div className="hidden md:block w-px h-20 bg-border/50" />
                                <div className="text-center md:text-right space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                        Fecha del pedido
                                    </p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {order.date}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 print:hidden">
        <div className="lg:col-span-2 space-y-10">
        <OrderItemsSection items={order.items} />
        <OrderPricingSummary subtotal={subtotal} discount={discount} couponCode={order.couponCode} total={order.total} />
        <OrderInfoGrid address={order.address} trackingNumber={order.trackingNumber} />
        </div>

        <div className="space-y-8">
        <OrderTimeline orderDate={order.date} status={order.status} />
      <OrderHelpCard />
      </div>
      </div>

                    {/* Receipt — only visible when printing (Download Receipt → Save as PDF) */}
                    <div className="hidden print:block text-black bg-white p-8">
                        <h1 className="text-2xl font-bold mb-1">Recibo de compra</h1>
                        <p className="text-sm mb-6">Orden #{order.id} — {order.date}</p>
                        <table className="w-full text-sm">
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-200">
                                        <td className="py-2">{item.qty} × {item.name}</td>
                                        <td className="py-2 text-right">${(item.price * item.qty).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {discount > 0 && (
                                    <tr>
                                        <td className="py-2">Descuento {order.couponCode ? `(${order.couponCode})` : ""}</td>
                                        <td className="py-2 text-right">-${discount.toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="py-3 text-lg font-bold">Total</td>
                                    <td className="py-3 text-lg font-bold text-right">${order.total.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-xs mt-6">{order.address}</p>
                    </div>
      </div>
      </main>
  );
}
