import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCmsPage } from "@/lib/strapi";
import { cmsHeader } from "@/lib/cms-page";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const cms = await getCmsPage("careers-pages");
    return {
        title: cms?.title ?? "Trabajá con Nosotros",
        description:
            cms?.subtitle ?? "Sumate al equipo y explorá oportunidades profesionales",
    };
}

const DEFAULT_JOBS = [
    {
        title: "Arquitecto Senior de Diseño",
        location: "Global / Remoto",
        desc: "Liderá el diseño espacial de nuestra próxima colección de productos.",
    },
    {
        title: "Controller de Operaciones",
        location: "Hub de Nueva York",
        desc: "Optimizá el flujo logístico y la integridad de la cadena de suministro en toda la red.",
    },
];

export default async function CareersPage() {
    const cms = await getCmsPage("careers-pages");
    const header = cmsHeader(cms, {
        badge: "Recursos Humanos",
        title: "Unite a Nuestra",
        highlight: "Red",
        subtitle:
            "Estamos construyendo un nuevo paradigma para entornos minimalistas y buscamos talento especializado para sumar a nuestro equipo.",
    });
    const jobs = cms?.jobs?.length ? cms.jobs : DEFAULT_JOBS;

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

                <section className="space-y-12">
                    <div className="flex items-center gap-6">
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary whitespace-nowrap">
                            Vacancias Activas
                        </h2>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {jobs.map((job: any) => (
                            <Card
                                key={job.title}
                                className="t-card border-none shadow-lg hover:shadow-xl group overflow-hidden"
                            >
                                <CardContent className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <h3 className="font-bold text-2xl tracking-tight group-hover:text-primary transition-colors">
                                                {job.title}
                                            </h3>
                                            {job.location && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-[10px]"
                                                >
                                                    <MapPin className="size-3 mr-1.5" />
                                                    {job.location}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-xl">
                                            {job.description ?? job.desc}
                                        </p>
                                    </div>
                                    <Button
                                        className="h-14 px-10 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 hover:-translate-y-0.5"
                                        asChild
                                    >
                                        <Link href="/contact">
                                            Postularme{" "}
                                            <ArrowRight className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="pt-12 text-center space-y-4">
                        <p className="text-muted-foreground font-semibold uppercase tracking-widest text-xs">
                            ¿No encontrás una vacancia para vos?
                        </p>
                        <a
                            href="mailto:careers@xcix.com"
                            className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-all border-b-2 border-primary/20 hover:border-primary pb-1"
                        >
                            careers@xcix.com
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
