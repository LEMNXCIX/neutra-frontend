import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FAQPage() {
    return (
    <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
        <div className="space-y-16">
            <header className="space-y-6 max-w-2xl">
                <Badge variant="secondary" className="px-4 py-1 rounded-full">Operational Logic</Badge>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                    Frequently <span className="text-primary">Asked</span> Questions
                </h1>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                    Standard operating procedures and protocol clarifications for the XCIX ecosystem.
                </p>
            </header>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                    { q: "Accepted Transaction Methods", a: "We support all primary credit protocols (Visa, MasterCard, Amex), PayPal, and Apple Pay for secure asset acquisition." },
                    { q: "Global Logistic Reach", a: "Current distribution network covers 50+ sovereign regions. Temporal estimates and rates vary by node location." },
                    { q: "Textile Maintenance Protocols", a: "Asset care varies by material composition. Consult the specific specification sheet or internal tag for precise maintenance logic." },
                    { q: "Protocol Monitoring", a: "Upon logistics exit, a tracking identifier will be dispatched. Real-time status is available via your personal dashboard." },
                    { q: "Warranty Framework", a: "We provide a 12-month structural integrity guarantee on all furniture and lighting. Textiles are covered by a 90-day operational warranty." }
                ].map((item, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border border-border/50 px-6 bg-card hover:bg-muted/30 transition-colors rounded-xl overflow-hidden shadow-sm">
                        <AccordionTrigger className="hover:no-underline py-6">
                            <span className="font-bold tracking-tight text-lg text-left">{item.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-8 text-muted-foreground font-medium text-base leading-relaxed border-t border-border/50 pt-6">
                            {item.a}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <div className="mt-20 p-12 bg-primary/5 border border-primary/10 rounded-[2.5rem] text-center space-y-6">
                <p className="text-muted-foreground font-semibold uppercase tracking-widest text-xs">Still have questions?</p>
                <Button size="lg" className="h-14 px-10 rounded-xl font-bold shadow-xl shadow-primary/10 transition-all hover:-translate-y-0.5" asChild>
                    <Link href="/contact">Initialize Support Protocol →</Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
