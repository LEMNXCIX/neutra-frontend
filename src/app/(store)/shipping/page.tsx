import React from "react";
import { Truck, Globe, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCmsPage } from "@/lib/strapi";
import { cmsHeader } from "@/lib/cms-page";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const cms = await getCmsPage("shipping-pages");
    return {
        title: cms?.title ?? "Envíos",
        description:
            cms?.subtitle ?? "Opciones de envío, tiempos de entrega y tarifas",
    };
}

const TIER_ICONS = [Truck, Clock, Globe];

const DEFAULT_TIERS = [
    {
        name: "Despacho Estándar",
        price: "Gratis +$99",
        description: "Sin cargo para pedidos superiores a $99 dentro del país.",
    },
    {
        name: "Prioridad Exprés",
        price: "",
        description: "Tiempos acelerados disponibles para pedidos urgentes.",
    },
    {
        name: "Red Global",
        price: "",
        description: "Logística internacional en más de 50 países con gestión aduanera.",
    },
];

const DEFAULT_METHODS = [
    { label: "Distribución Estándar", description: "03 - 07 días hábiles" },
    { label: "Exprés Prioritario", description: "01 - 03 días hábiles" },
    { label: "Logística Global", description: "07 - 21 días hábiles" },
];

export default async function ShippingPage() {
    const cms = await getCmsPage("shipping-pages");
    const header = cmsHeader(cms, {
        badge: "Logística y Entregas",
        title: "Envíos a",
        highlight: "Todo el Mundo",
        subtitle:
            "Nuestra red de distribución está optimizada para eficiencia y seguridad. Trabajamos con nodos logísticos de alto rendimiento para entregas rápidas a nivel global.",
    });
    const tiers = cms?.methods?.length
        ? cms.methods.map((m: any, i: number) => ({
              icon: TIER_ICONS[i % TIER_ICONS.length],
              title: m.name,
              price: m.price,
              desc: m.description,
          }))
        : DEFAULT_TIERS.map((t, i) => ({ icon: TIER_ICONS[i], ...t }));
    const methods = cms?.tiers?.length
        ? cms.tiers.map((t: any) => ({ label: t.label, description: t.description }))
        : DEFAULT_METHODS;

    return (
        <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
            <div className="space-y-24">
                <header className="space-y-6 max-w-3xl">
                    <Badge
                        variant="secondary"
                        className="px-4 py-1 rounded-full"
                    >
                        {header.badge}
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-[0.9]">
                        {header.title}{" "}
                        <span className="text-primary">{header.highlight}</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                        {header.subtitle}
                    </p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tiers.map((tier: any) => (
                        <Card
                            key={tier.title}
                            className="t-card border-none shadow-lg group overflow-hidden"
                        >
                            <CardContent className="p-10 space-y-6">
                                <div className="size-14 bg-primary/10 text-primary flex items-center justify-center rounded-xl transition-transform group-hover:scale-110 duration-500">
                                    <tier.icon className="size-7" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-bold text-xl tracking-tight">
                                            {tier.title}
                                        </h3>
                                        {tier.price && (
                                            <span className="text-sm font-bold text-primary">
                                                {tier.price}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                        {tier.desc}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    <div className="lg:col-span-7 space-y-16">
                        <div className="space-y-6">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                                Procesamiento
                            </h2>
                            <p className="text-lg text-foreground font-medium leading-relaxed italic border-l-2 border-muted pl-8">
                                La mayoría de los pedidos se procesan dentro de
                                1-2 días hábiles. Las solicitudes fuera del
                                horario operativo se procesan en la siguiente
                                ventana hábil.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                                Tiempos Estimados
                            </h2>
                            <ul className="space-y-4">
                                {methods.map((item: any) => (
                                    <li
                                        key={item.label}
                                        className="flex justify-between items-center border-b border-border pb-4 group"
                                    >
                                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {item.label}
                                        </span>
                                        <span className="text-muted-foreground font-medium tabular-nums">
                                            {item.description}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="lg:col-span-5 sticky top-32">
                        <Card className="t-card border-none shadow-xl bg-primary text-primary-foreground p-10 space-y-6 overflow-hidden relative">
                            <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl" />
                            <h3 className="font-bold text-2xl tracking-tight">
                                Seguí tu Pedido
                            </h3>
                            <p className="text-sm font-medium leading-relaxed opacity-90">
                                Al despachar, tu panel personal se actualizará
                                con un número de seguimiento único. Monitoreá
                                el envío en tiempo real.
                            </p>
                            <Button
                                className="w-full h-14 rounded-xl font-bold bg-white text-primary hover:bg-white/90 shadow-lg"
                                asChild
                            >
                                <Link href="/profile">Ir al Panel →</Link>
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
