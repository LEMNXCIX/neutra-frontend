
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
} from 'lucide-react';
import Link from 'next/link';

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
    console.log(`Fetching order from: ${url}`);

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      }
    });

    console.log(`Response status: ${res.status}`);

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
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" asChild className="mb-2">
                <Link href="/profile">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Link>
              </Button>
              <h1 className="text-4xl font-bold">Order Details</h1>
              <p className="text-muted-foreground">Order #{order.id}</p>
            </div>
            <Button asChild>
              <a
                href={`/api/orders/${order.id}/receipt`}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </a>
            </Button>
          </div>

          {/* Status Card */}
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${currentStatus.color}/10`}>
                  <StatusIcon className={`h-8 w-8 text-${currentStatus.color.replace('bg-', '')}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold">{currentStatus.label}</h2>
                    <Badge className={currentStatus.color}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{currentStatus.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items Card */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items.map((item) => {
                    const itemTotal = item.price * item.qty;
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{item.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Qty: {item.qty}</span>
                            <span>×</span>
                            <span>${item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${itemTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}

                  <Separator />

                  {/* Price Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                        <span className="font-medium">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                    <p className="font-medium">{order.address}</p>
                  </div>
                  {order.trackingNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-3 py-1 rounded font-mono text-sm">
                          {order.trackingNumber}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(order.trackingNumber || '');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Order Date</p>
                      <p className="font-medium">{order.date}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Order ID</p>
                      <p className="font-medium font-mono">#{order.id}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base">Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Order Placed</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Shipped</p>
                        <p className="text-xs text-muted-foreground">
                          {order.status === 'shipped' || order.status === 'delivered' ? 'In transit' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Delivered</p>
                        <p className="text-xs text-muted-foreground">
                          {order.status === 'delivered' ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="border-none shadow-md bg-muted/30">
                <CardContent className="pt-6">
                  <p className="text-sm text-center text-muted-foreground mb-4">
                    Need help with your order?
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/profile">Contact Support</Link>
                  </Button>
                </CardContent>
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
