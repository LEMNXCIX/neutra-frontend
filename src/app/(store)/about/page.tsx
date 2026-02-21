import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
    return (
    <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
        <div className="space-y-24">
            <header className="space-y-6 max-w-3xl">
                <Badge variant="secondary" className="px-4 py-1 rounded-full">Foundation & Vision</Badge>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-[0.9]">
                    Our Unique <span className="text-primary">Identity</span>
                </h1>
                <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                    Redefining modern environments through intentional design and technical excellence.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                <div className="lg:col-span-5 space-y-8">
                    <p className="text-3xl font-semibold tracking-tight text-foreground leading-snug italic border-l-4 border-primary pl-8">
                        "Architecting minimal living through technical precision and sustainable sourcing."
                    </p>
                </div>
                
                <div className="lg:col-span-7 space-y-8 text-muted-foreground font-medium text-lg leading-relaxed">
                    <p>
                        XCIX is a curated ecosystem of minimalist structures and high-performance home assets. 
                        We believe in intentional design that optimizes your spatial environment without technical clutter.
                    </p>
                    <p>
                        Established in 2024, our objective is to provision high-quality, ethically engineered 
                        pieces to modern environments globally. Every asset in our catalog is validated for 
                        craftsmanship, material integrity, and timeless aesthetic performance.
                    </p>
                    <p>
                        We collaborate with specialized engineers and designers who share our vision for 
                        functional optimization. From raw material intake to final logistics, we minimize 
                        environmental load while maximizing the utility and beauty of our products.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: "Asset Validation", value: "100%" },
                    { label: "Nodes Active", value: "48k" },
                    { label: "Global Reach", value: "50+" }
                ].map((stat, i) => (
                    <Card key={i} className="t-card border-none shadow-lg overflow-hidden group">
                        <CardContent className="p-10 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{stat.label}</p>
                            <p className="text-5xl font-bold tracking-tighter group-hover:scale-105 transition-transform duration-500">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}
