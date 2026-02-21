import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function ReturnsPage() {
    return (
    <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
        <div className="space-y-24">
            <header className="space-y-6 max-w-3xl">
                <Badge variant="secondary" className="px-4 py-1 rounded-full">RMA Protocol</Badge>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-[0.9]">
                    Reverse <span className="text-primary">Logistics</span>
                </h1>
                <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
                    We ensure asset satisfaction. If an instance does not meet your operational standards, 
                    we provide a 30-day return window from the point of delivery.
                </p>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                <div className="lg:col-span-5">
                    <Card className="t-card border-none shadow-2xl bg-foreground text-background overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                        <CardContent className="p-10">
                            <h2 className="text-3xl font-bold tracking-tight mb-10">Initialization</h2>
                            <div className="space-y-8">
                                {[
                                    "Access your Profile Dashboard.",
                                    "Select the specific Order Identification.",
                                    "Initialize RMA Protocol to generate a logistics label.",
                                    "Securely pack and dispatch the asset via an authorized node."
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                            {i+1}
                                        </span>
                                        <span className="font-medium text-sm text-background/80 group-hover:text-background transition-colors pt-1.5">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-16">
                    <div className="space-y-8">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Policy Framework</h2>
                        <ul className="space-y-6">
                            {[
                                "Return must be initialized within 30 solar days of receipt.",
                                "Assets must be in original condition, unutilized, with all integrity tags active.",
                                "Large-scale furniture assets may incur a restocking fee.",
                                "Assets designated as 'Final Sale' are ineligible for RMA protocols."
                            ].map((text, i) => (
                                <li key={i} className="flex items-start gap-4 text-lg text-muted-foreground font-medium leading-relaxed group">
                                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1 transition-transform group-hover:scale-110" />
                                    <span className="group-hover:text-foreground transition-colors">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6 p-10 bg-muted/30 rounded-[2rem] border border-border/50">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Refund Protocol</h2>
                        <p className="text-lg text-foreground font-medium leading-relaxed italic">
                            Upon successful asset intake and validation, please allow 5-7 business cycles for credit restoration. 
                            Funds will be returned to the original source. Logistics costs are non-restorable.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    </div>
  );
}
