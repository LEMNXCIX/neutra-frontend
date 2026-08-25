import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCmsPage } from "@/lib/strapi";
import { cmsHeader, cmsRichText } from "@/lib/cms-page";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const cms = await getCmsPage("about-pages");
    return {
        title: cms?.title ?? "Sobre Nosotros",
        description: cms?.subtitle ?? "Conocé nuestra misión, visión y equipo",
    };
}

const DEFAULT_STATS = [
    { label: "Validación de Activos", value: "100%" },
    { label: "Nodos Activos", value: "48k" },
    { label: "Alcance Global", value: "50+" },
];

export default async function AboutPage() {
    const cms = await getCmsPage("about-pages");
    const header = cmsHeader(cms, {
        badge: "Fundamento y Visión",
        title: "Nuestra",
        highlight: "Identidad",
        subtitle:
            "Redefiniendo entornos modernos a través del diseño intencional y la excelencia técnica.",
    });
    const stats = cms?.stats?.length ? cms.stats : DEFAULT_STATS;

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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    <div className="lg:col-span-5 space-y-8">
                        <p className="text-3xl font-semibold tracking-tight text-foreground leading-snug italic border-l-2 border-primary pl-8">
                            "{cms?.quote ??
                                "Arquitectura de vida minimalista a través de la precisión técnica y el abastecimiento sostenible."}"
                        </p>
                    </div>

                    <div
                        className="lg:col-span-7 space-y-8 text-muted-foreground font-medium text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{
                            __html: cmsRichText(
                                cms?.content,
                                "<p>XCIX es un ecosistema curado de estructuras minimalistas y productos de alto rendimiento. Creemos en el diseño intencional que optimiza tu entorno sin complicaciones técnicas.</p><p>Establecidos en 2024, nuestro objetivo es proveer piezas de alta calidad, diseñadas éticamente para entornos modernos a nivel global. Cada producto de nuestro catálogo es validado por su artesanía, integridad de materiales y estética atemporal.</p><p>Colaboramos con ingenieros y diseñadores especializados que comparten nuestra visión de optimización funcional. Desde la materia prima hasta la logística, minimizamos el impacto ambiental maximizando la utilidad y belleza de nuestros productos.</p>"
                            ),
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {stats.map((stat: any) => (
                        <Card
                            key={stat.label ?? stat.value}
                            className="t-card border-none shadow-lg overflow-hidden group"
                        >
                            <CardContent className="p-10 space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                    {stat.label}
                                </p>
                                <p className="text-5xl font-bold tracking-tighter group-hover:scale-105 transition-transform duration-500">
                                    {stat.value}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
