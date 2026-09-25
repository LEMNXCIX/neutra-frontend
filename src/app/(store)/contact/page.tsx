import React from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCmsPage } from "@/lib/strapi";
import { cmsHeader } from "@/lib/cms-page";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const cms = await getCmsPage("contact-pages");
    return {
        title: cms?.title ?? "Contacto",
        description: cms?.subtitle ?? "Ponete en contacto con nuestro equipo",
    };
}

export default async function ContactPage() {
    const cms = await getCmsPage("contact-pages");
    const header = cmsHeader(cms, {
        badge: "Soporte y Consultas",
        title: "Ponete en",
        highlight: "Contacto",
        subtitle:
            "¿Tenés preguntas? Estamos para ayudarte. Escribinos por cualquier consulta.",
    });

    return (
        <div className="max-w-6xl mx-auto px-6 py-24 animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div className="space-y-10">
                    <div className="space-y-6">
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
                        <p className="text-lg text-muted-foreground font-medium max-w-md leading-relaxed">
                            {header.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4 group">
                            <div className="size-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <Mail className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                                    Escribinos
                                </h3>
                                <p className="font-bold text-base hover:text-primary transition-colors">
                                    {cms?.email ?? "contacto@xcix.com"}
                                </p>
                                <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Soporte Activo
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 group">
                            <div className="size-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <Phone className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                                    Llamanos
                                </h3>
                                <p className="font-bold text-base">
                                    {cms?.phone ?? "+1 (555) 800-XCIX"}
                                </p>
                                <p className="text-[11px] font-medium text-muted-foreground mt-1">
                                    Lun - Vie • 9:00 - 18:00
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 group col-span-1 sm:col-span-2">
                            <div className="size-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <MapPin className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                                    Visitá Nuestra Oficina
                                </h3>
                                <p className="font-bold text-base">
                                    {cms?.address ??
                                        "123 Avenida del Diseño, Metrópolis, NY 10012"}
                                </p>
                                <button
                                    type="button"
                                    className="text-[11px] font-semibold text-primary mt-1 hover:underline underline-offset-4 flex items-center gap-1"
                                >
                                    Abrir en Maps →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="t-card border-none shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Enviar Mensaje
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Completá el formulario y te responderemos a la
                            brevedad.
                        </p>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-5">
                        <div className="space-y-2">
                            <label
                                htmlFor="name"
                                className="text-xs font-semibold text-foreground ml-1"
                            >
                                Nombre Completo
                            </label>
                            <Input
                                type="text"
                                id="name"
                                placeholder="Juan Pérez"
                                className="h-12 border-muted-foreground/20 focus:border-primary transition-[color,background-color,border-color,box-shadow,opacity,transform]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-xs font-semibold text-foreground ml-1"
                            >
                                Correo Electrónico
                            </label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="juan@ejemplo.com"
                                className="h-12 border-muted-foreground/20 focus:border-primary transition-[color,background-color,border-color,box-shadow,opacity,transform]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="message"
                                className="text-xs font-semibold text-foreground ml-1"
                            >
                                Tu Mensaje
                            </label>
                            <Textarea
                                id="message"
                                rows={5}
                                className="border-muted-foreground/20 focus:border-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] resize-none"
                                placeholder="¿Cómo podemos ayudarte?"
                            />
                        </div>
                        <Button
                            type="button"
                            className="w-full h-14 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-[color,background-color,border-color,box-shadow,opacity,transform]"
                        >
                            <Send size={16} className="mr-2" /> Enviar Mensaje
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
