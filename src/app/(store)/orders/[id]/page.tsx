
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  ArrowLeft,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

export default async function OrderPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Fetch from backend API instead of local file
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const url = `${baseUrl}/order/${params.id}`;

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      }
    });

    if (res.status === 401) {
      redirect('/auth/login?returnUrl=/orders/' + params.id);
    }

    if (!res.ok) {
      return notFound();
    }

    const data = await res.json();
    // Handle StandardResponse format
    const rawOrder = data.data || data.order;

    if (!rawOrder) return notFound();

    // Map API response to Order type
    const order: Order = {
      id: rawOrder.id,
      userId: rawOrder.userId,
      total: rawOrder.total,
      status: rawOrder.status,
      trackingNumber: rawOrder.trackingNumber,
      address: rawOrder.user?.email || 'Address not available', // Fallback since address might not be in response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: rawOrder.items?.map((item: any) => ({
        id: item.id,
        name: item.product?.name || 'Unknown Product',
        qty: item.amount,
        price: item.price
      })) || [],
      date: new Date(rawOrder.createdAt).toLocaleDateString(),
      couponCode: rawOrder.couponId,
      discount: rawOrder.discountAmount
    };

    // Status configurations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusConfig: Record<string, { label: string; color: string; icon: any; description: string }> = {
      processing: {
        label: 'Processing',
        color: 'bg-yellow-500',
        icon: Clock,
        description: 'Your order is being prepared',
      },
      shipped: {
        label: 'Shipped',
        color: 'bg-blue-500',
        icon: Truck,
        description: 'Your order is on its way',
      },
      delivered: {
        label: 'Delivered',
        color: 'bg-green-500',
        icon: CheckCircle2,
        description: 'Your order has been delivered',
      },
      cancelled: {
        label: 'Cancelled',
        color: 'bg-red-500',
        icon: XCircle,
        description: 'This order was cancelled',
      },
      PAGADO: {
        label: 'Paid',
        color: 'bg-blue-500',
        icon: CreditCard,
        description: 'Order has been paid and is being processed',
      }
    };

    const currentStatus = statusConfig[order.status] || statusConfig.processing;
    const StatusIcon = currentStatus.icon;

    const subtotal = order.items.reduce((sum: number, item: OrderItem) => sum + (item.price * item.qty), 0);
    const discount = order.discount || 0;

    return (
      <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-16 px-6 animate-in fade-in duration-700">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/50 pb-10">
            <div className="space-y-4">
              <Button variant="ghost" asChild className="group font-bold uppercase tracking-widest text-[10px] p-0 h-auto hover:bg-transparent rounded-xl transition-all">
                <Link href="/profile" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-primary" strokeWidth={3} />
                  Back to Profile
                </Link>
              </Button>
              <div className="space-y-2">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-none">Order Details</h1>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Order ID: #{order.id}</p>
              </div>
            </div>
            <Button className="h-14 px-10 rounded-2xl font-bold bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10 transition-all hover:-translate-y-1" asChild>
              <a
                href={`/api/orders/${order.id}/receipt`}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-5 w-5 mr-3" strokeWidth={2} />
                Download Receipt
              </a>
            </Button>
          </div>

          {/* Status Card */}
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className={cn("p-8 rounded-[2rem] shadow-inner border border-border/50 flex items-center justify-center", currentStatus.color.replace('bg-', 'bg-').replace('500', '500/10'))}>
                  <StatusIcon className={cn("h-14 w-14", currentStatus.color.replace('bg-', 'text-'))} strokeWidth={2} />
                </div>
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <h2 className="text-4xl font-bold tracking-tight text-foreground">{currentStatus.label}</h2>
                    <Badge className={cn("px-4 py-1.5 font-bold text-[10px] tracking-widest rounded-full uppercase border-none shadow-sm", currentStatus.color)}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-medium text-lg max-w-md">{currentStatus.description}</p>
                </div>
                <div className="hidden md:block w-px h-20 bg-border/50" />
                <div className="text-center md:text-right space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Order Date</p>
                    <p className="text-2xl font-bold text-foreground">{order.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Order Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Items Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                        <Package size={18} className="text-primary" /> Order Items
                    </h3>
                    <div className="h-px flex-1 bg-border/30" />
                </div>
                
                <div className="space-y-4">
                  {order.items.map((item) => {
                    const itemTotal = item.price * item.qty;
                    return (
                      <Card key={item.id} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden bg-background">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex-1 space-y-2">
                                    <h3 className="font-bold text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        <span className="bg-muted px-3 py-1 rounded-full">Qty: {item.qty}</span>
                                        <span className="bg-muted px-3 py-1 rounded-full">Price: ${item.price.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold tracking-tight text-foreground">${itemTotal.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pricing Summary */}
                <div className="p-10 bg-muted/30 backdrop-blur-sm border border-border/50 rounded-[2.5rem] space-y-6 shadow-inner">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
                          <span>Subtotal</span>
                          <span className="text-foreground">${subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-emerald-600">
                            <span className="flex items-center gap-2"><Tag size={16} /> Discount {order.couponCode && `(${order.couponCode})`}</span>
                            <span>-${discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
                          <span>Shipping</span>
                          <span className="text-foreground">Calculated at checkout</span>
                        </div>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Total Amount</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-muted-foreground uppercase">USD</span>
                            <span className="text-6xl font-bold tracking-tight text-foreground">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl rounded-[2rem] bg-background group hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                                <MapPin size={16} />
                            </div>
                            Shipping Address
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <p className="font-bold text-xl leading-relaxed text-foreground/80">{order.address}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2rem] bg-background group hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-purple-600 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600/10 rounded-xl flex items-center justify-center">
                                <Truck size={16} />
                            </div>
                            Tracking Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-8">
                        {order.trackingNumber ? (
                            <div className="space-y-4">
                                <div className="bg-muted/50 px-6 py-4 rounded-2xl font-mono text-base font-bold tracking-tight border border-border/30 text-center">
                                    {order.trackingNumber}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-foreground hover:text-background transition-all"
                                >
                                    Copy Number
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 space-y-2 opacity-60">
                                <Clock className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Preparing for Shipment</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <Card className="border-none shadow-2xl rounded-[2rem] bg-background overflow-hidden">
                <CardHeader className="bg-muted/30 p-8 border-b border-border/50">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Order Timeline</CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="space-y-12 relative">
                    <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-muted/50 z-0" />
                    
                    {[
                        { label: 'Order Placed', date: order.date, active: true },
                        { label: 'In Transit', date: order.status === 'shipped' || order.status === 'delivered' ? 'Shipped to destination' : 'Processing in warehouse', active: order.status === 'shipped' || order.status === 'delivered' },
                        { label: 'Delivered', date: order.status === 'delivered' ? 'Final delivery successful' : 'Expected soon', active: order.status === 'delivered' }
                    ].map((step, i) => (
                        <div key={i} className="flex gap-8 relative z-10">
                            <div className={cn(
                                "w-5 h-5 rounded-full mt-1 border-4 transition-all duration-700",
                                step.active ? "bg-primary border-primary/20 scale-125 shadow-lg shadow-primary/20" : "bg-background border-muted"
                            )} />
                            <div className="space-y-2">
                                <p className={cn("font-bold uppercase text-[10px] tracking-widest", step.active ? "text-foreground" : "text-muted-foreground")}>
                                    {step.label}
                                </p>
                                <p className="text-sm font-medium text-muted-foreground">{step.date}</p>
                            </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-primary/5 to-purple-600/5 p-10 text-center space-y-8">
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Need Assistance?</p>
                    <p className="text-base font-medium leading-relaxed text-muted-foreground">Have questions about your order or need to request a return?</p>
                </div>
                <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold uppercase tracking-widest text-[10px] hover:bg-foreground hover:text-background transition-all" asChild>
                    <Link href="/contact">Contact Support</Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );

  } catch (error) {
    console.error('Error fetching order:', error);
    return notFound();
  }
}
