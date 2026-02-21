'use client';

import React, { useState } from 'react';
import { Order } from '@/types/order.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Calendar, Package, MapPin, Truck, Eye, Download, DollarSign } from 'lucide-react';

interface OrderHistoryProps {
    initialOrders: Order[];
}

export function OrderHistory({ initialOrders }: OrderHistoryProps) {
    const [orders] = useState<Order[]>(initialOrders);
    const [expanded, setExpanded] = useState<string | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETADO": case "ENTREGADO": return "bg-green-500 text-white";
            case "ENVIADO": return "bg-blue-500 text-white";
            case "PAGADO": return "bg-purple-500 text-white";
            case "PENDIENTE": return "bg-yellow-500 text-white";
            case "CANCELADO": return "bg-red-500 text-white";
            default: return "bg-gray-500 text-white";
        }
    };

    if (orders.length === 0) {
        return (
            <Card className="text-center py-12">
                <CardContent>
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No orders yet</h3>
                    <p className="text-muted-foreground mb-6">Start shopping to see your history</p>
                    <Button asChild><a href="/">Start Shopping</a></Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-6 w-6" /> Order History
            </h2>
            <div className="space-y-4">
                {orders.map((o) => (
                    <Card key={o.id} className="overflow-hidden border-none shadow-md">
                        <CardHeader className="bg-muted/30">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-lg">Order #{o.id.slice(-6)}</CardTitle>
                                    <Badge className={getStatusColor(o.status)}>{o.status}</Badge>
                                </div>
                                <span className="font-bold text-lg">${o.total.toFixed(2)}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(o.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><Package className="h-4 w-4" /> {o.items.length} items</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                                    {expanded === o.id ? "Hide Details" : "View Details"}
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                    <a href={`/orders/${o.id}`}><Eye className="h-4 w-4 mr-1" /> Full Page</a>
                                </Button>
                            </div>
                            {expanded === o.id && (
                                <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                                    {o.items.map((it) => (
                                        <div key={it.id} className="flex justify-between text-sm">
                                            <span>{it.product?.name || 'Product'} x {it.amount}</span>
                                            <span className="font-medium">${(it.price * it.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <Separator />
                                    <div className="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>${o.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
