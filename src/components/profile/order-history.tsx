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
            <Card className="text-center py-20 border-none shadow-xl rounded-[2rem] bg-muted/20">
                <CardContent className="space-y-6">
                    <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight">No orders yet</h3>
                        <p className="text-muted-foreground font-medium">Your purchase history will appear here once you place an order.</p>
                    </div>
                    <Button asChild size="lg" className="rounded-xl px-8 font-bold"><a href="/">Explore Products</a></Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-primary" /> Purchase History
            </h2>
            <div className="space-y-6">
                {orders.map((o) => (
                    <Card key={o.id} className="overflow-hidden border-none shadow-lg rounded-[2rem] bg-background group hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="bg-muted/30 p-8 border-b border-border/50">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shadow-sm">
                                        <Package className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold tracking-tight">Order #{o.id.slice(-6).toUpperCase()}</CardTitle>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{new Date(o.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                    <Badge className={`${getStatusColor(o.status)} rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest border-none shadow-sm`}>{o.status}</Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Amount</p>
                                    <span className="font-bold text-3xl tracking-tight text-foreground">${o.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex flex-wrap gap-8 text-sm font-medium">
                                <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 text-primary" /> {new Date(o.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-2 text-muted-foreground"><Package className="h-4 w-4 text-primary" /> {o.items.length} {o.items.length === 1 ? 'item' : 'items'} included</span>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" size="lg" className="rounded-xl font-bold border-2 px-6 h-12 hover:bg-muted" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                                    {expanded === o.id ? "Hide Summary" : "View Summary"}
                                </Button>
                                <Button variant="secondary" size="lg" className="rounded-xl font-bold px-6 h-12" asChild>
                                    <a href={`/orders/${o.id}`} className="flex items-center gap-2"><Eye className="h-4 w-4" /> Full Details</a>
                                </Button>
                            </div>
                            {expanded === o.id && (
                                <div className="pt-8 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Order Items</p>
                                    {o.items.map((it) => (
                                        <div key={it.id} className="flex justify-between items-center group/item p-4 rounded-xl hover:bg-muted/50 transition-colors">
                                            <div className="space-y-1">
                                                <p className="font-bold text-foreground">{it.product?.name || 'Product'}</p>
                                                <p className="text-xs text-muted-foreground font-medium">Quantity: {it.amount}</p>
                                            </div>
                                            <span className="font-bold text-lg tracking-tight">${(it.price * it.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="pt-4 mt-4 border-t border-dashed border-border flex justify-between items-center px-4">
                                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Order Total</span>
                                        <span className="font-bold text-2xl tracking-tight text-primary">${o.total.toFixed(2)}</span>
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
