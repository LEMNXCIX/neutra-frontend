import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function TermsPage() {
    return (
    <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
        <div className="space-y-16">
            <header className="space-y-6 max-w-2xl">
                <Badge variant="secondary" className="px-4 py-1 rounded-full">Legal Protocol</Badge>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                    Service <span className="text-primary">Agreement</span>
                </h1>
                <p className="text-muted-foreground font-semibold uppercase tracking-widest text-[10px]">Registry Revision: {new Date().toLocaleDateString()}</p>
            </header>

            <div className="space-y-16">
                {[
                    { h: "1. Terminology & Agreement", p: "By accessing or utilizing the XCIX infrastructure, you acknowledge and accept these Terms of Service. If you do not align with these protocols, do not initiate a session." },
                    { h: "2. Asset Valuation & Accuracy", p: "We strive for chromatic accuracy in our asset representations. However, we cannot guarantee your terminal's visual reproduction of specific hues. Asset pricing is dynamic and subject to update without prior notification." },
                    { h: "3. Restoration & Credit", p: "Our RMA protocol is restricted to a 30-day temporal window. Assets must maintain original integrity to be eligible for credit restoration. Final sale designations are non-restorable." },
                    { h: "4. Liability Parameters", p: "XCIX holds zero liability for collateral, indirect, or incidental performance failures resulting from asset utilization or inability to access platform protocols." }
                ].map((section, i) => (
                    <section key={i} className="space-y-4 border-l-2 border-primary/20 pl-10 group hover:border-primary transition-all duration-500">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{section.h}</h2>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed">{section.p}</p>
                    </section>
                ))}
            </div>

            <footer className="pt-16 border-t border-border mt-20">
                <p className="text-xs font-medium text-muted-foreground italic">
                    Utilizing this platform constitutes a binding legal commitment to the above protocols.
                </p>
            </footer>
        </div>
    </div>
  );
}
