import React from 'react';
import { Truck, Globe, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ShippingPage() {
    return (
    <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
        <div className="space-y-24">
            <header className="space-y-6 max-w-3xl">
                <Badge variant="secondary" className="px-4 py-1 rounded-full">Logistics & Delivery</Badge>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-[0.9]">
                    Global <span className="text-primary">Dispatch</span>
                </h1>
                <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                    Our distribution network is optimized for technical efficiency and asset security. 
                    We leverage high-performance logistics nodes to ensure rapid delivery globally.
                </p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Truck, title: "Standard Dispatch", desc: "Complementary for assets above $99 within the continental network." },
                    { icon: Clock, title: "Express Priority", desc: "Accelerated temporal windows available for urgent asset intake." },
                    { icon: Globe, title: "Global Network", desc: "Logistics covering 50+ sovereign regions with customs optimization." }
                ].map((tier, i) => (
                    <Card key={i} className="t-card border-none shadow-lg group overflow-hidden">
                        <CardContent className="p-10 space-y-6">
                            <div className="w-14 h-14 bg-primary/10 text-primary flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110 duration-500">
                                <tier.icon className="h-7 w-7" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-xl tracking-tight">{tier.title}</h3>
                                <p className="text-sm font-medium text-muted-foreground leading-relaxed">{tier.desc}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                <div className="lg:col-span-7 space-y-16">
                    <div className="space-y-6">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Processing Logic</h2>
                        <p className="text-lg text-foreground font-medium leading-relaxed italic border-l-4 border-muted pl-8">
                            Most asset allocations are processed within 1-2 business cycles. 
                            Requests initiated during non-operational periods will be queued for the following business window.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Temporal Estimates</h2>
                        <ul className="space-y-4">
                            {[
                                { label: "Standard Distribution", time: "03 - 07 Cycles" },
                                { label: "Priority Express", time: "01 - 03 Cycles" },
                                { label: "Global Logistics", time: "07 - 21 Cycles" }
                            ].map((item, i) => (
                                <li key={i} className="flex justify-between items-center border-b border-border pb-4 group">
                                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                                    <span className="text-muted-foreground font-medium tabular-nums">{item.time}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-5 sticky top-32">
                    <Card className="t-card border-none shadow-xl bg-primary text-primary-foreground p-10 space-y-6 overflow-hidden relative">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <h3 className="font-bold text-2xl tracking-tight">Track Your Asset</h3>
                        <p className="text-sm font-medium leading-relaxed opacity-90">
                            Upon dispatch, your personal node dashboard will be updated with a unique tracking identifier. 
                            Monitor the logistics flow in real-time.
                        </p>
                        <Button className="w-full h-14 rounded-xl font-bold bg-white text-primary hover:bg-white/90 shadow-lg" asChild>
                            <Link href="/profile">Access Dashboard →</Link>
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
}
