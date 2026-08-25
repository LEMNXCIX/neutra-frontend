import React from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCmsPage } from "@/lib/strapi";
import { cmsHeader } from "@/lib/cms-page";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const cms = await getCmsPage("faq-pages");
    return {
        title: cms?.title ?? "Preguntas Frecuentes",
        description: cms?.subtitle ?? "Preguntas y respuestas frecuentes",
    };
}

const DEFAULT_FAQS = [
    {
        q: "Métodos de Pago Aceptados",
        a: "Aceptamos las principales tarjetas (Visa, MasterCard, Amex), PayPal y Apple Pay para compras seguras.",
    },
    {
        q: "Cobertura Logística Global",
        a: "Nuestra red de distribución cubre más de 50 países. Los tiempos y tarifas varían según la ubicación.",
    },
    {
        q: "Cuidado de los Productos",
        a: "El cuidado varía según la composición del material. Consultá la ficha técnica o la etiqueta interna para instrucciones precisas.",
    },
    {
        q: "Seguimiento de Pedidos",
        a: "Al despachar tu pedido recibirás un número de seguimiento. El estado en tiempo real está disponible en tu panel personal.",
    },
    {
        q: "Marco de Garantía",
        a: "Ofrecemos 12 meses de garantía estructural en muebles e iluminación. Los textiles tienen 90 días de garantía.",
    },
];

export default async function FAQPage() {
    const cms = await getCmsPage("faq-pages");
    const header = cmsHeader(cms, {
        badge: "Lógica Operativa",
        title: "Preguntas",
        highlight: "Frecuentes",
        subtitle: "Procedimientos estándar y respuestas del ecosistema.",
    });
    const faqs = cms?.faqs?.length
        ? cms.faqs.map((f: any) => ({ q: f.question, a: f.answer }))
        : DEFAULT_FAQS;

    return (
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
            <div className="space-y-16">
                <header className="space-y-6 max-w-2xl">
                    <Badge
                        variant="secondary"
                        className="px-4 py-1 rounded-full"
                    >
                        {header.badge}
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                        {header.title}{" "}
                        <span className="text-primary">{header.highlight}</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                        {header.subtitle}
                    </p>
                </header>

                <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-4"
                >
                    {faqs.map((item) => (
                        <AccordionItem
                            key={item.q}
                            value={item.q}
                            className="border border-border/50 px-6 bg-card hover:bg-muted/30 transition-colors rounded-xl overflow-hidden shadow-sm"
                        >
                            <AccordionTrigger className="hover:no-underline py-6">
                                <span className="font-bold tracking-tight text-lg text-left">
                                    {item.q}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-8 text-muted-foreground font-medium text-base leading-relaxed border-t border-border/50 pt-6">
                                {item.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <div className="mt-20 p-12 bg-primary/5 border border-primary/10 rounded-[2.5rem] text-center space-y-6">
                    <p className="text-muted-foreground font-semibold uppercase tracking-widest text-xs">
                        ¿Todavía tenés preguntas?
                    </p>
                    <Button
                        size="lg"
                        className="h-14 px-10 rounded-xl font-bold shadow-xl shadow-primary/10 transition-all hover:-translate-y-0.5"
                        asChild
                    >
                        <Link href="/contact">Contactá a Soporte →</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
