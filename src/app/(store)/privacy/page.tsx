import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function PrivacyPage() {
    return (
    <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
        <div className="space-y-16">
            <header className="space-y-6 max-w-2xl">
                <Badge variant="secondary" className="px-4 py-1 rounded-full">Data Standards</Badge>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                    Privacy <span className="text-primary">Protocol</span>
                </h1>
                <p className="text-muted-foreground font-semibold uppercase tracking-widest text-[10px]">Security Hash Updated: {new Date().toLocaleDateString()}</p>
            </header>

            <div className="space-y-16">
                {[
                    { h: "1. Data Acquisition", p: "We collect metadata provided during node initialization, session establishment, and asset acquisition. This encompasses identification markers, electronic addresses, and secure transaction tokens." },
                    { h: "2. Operational Utilization", p: "Acquired data is utilized to optimize logistics, facilitate communication regarding asset status, and strengthen network integrity against fraudulent operations." },
                    { h: "3. Cryptographic Storage", p: "We implement advanced encryption protocols to safeguard your personal identity. Data integrity is a core component of our architectural foundation." },
                    { h: "4. Cookie Logic", p: "Temporal cookies are utilized to enhance session performance and analyze grid traffic patterns. You maintain control over these parameters via your terminal settings." }
                ].map((section, i) => (
                    <section key={i} className="space-y-4 border-l-2 border-primary/20 pl-10 group hover:border-primary transition-all duration-500">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{section.h}</h2>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed">{section.p}</p>
                    </section>
                ))}
            </div>

            <footer className="pt-16 border-t border-border mt-20">
                <p className="text-xs font-medium text-muted-foreground italic">
                    Your digital identity is isolated and encrypted within the XCIX grid.
                </p>
            </footer>
        </div>
    </div>
  );
}
