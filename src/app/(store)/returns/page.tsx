import { getCmsPage } from "@/lib/strapi";
import { cmsHeader } from "@/lib/cms-page";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const cms = await getCmsPage("returns-pages");
    return {
        title: cms?.title ?? "Devoluciones y Reembolsos",
        description:
            cms?.subtitle ?? "Conocé nuestra política de devoluciones y reembolsos",
    };
}

const DEFAULT_STEPS = [
    "Accedé a tu panel de perfil.",
    "Seleccioná el número de pedido correspondiente.",
    "Iniciá el proceso de RMA para generar la etiqueta de envío.",
    "Empaquetá bien el producto y despachalo por un punto autorizado.",
];

const DEFAULT_POLICIES = [
    "La devolución debe iniciarse dentro de los 30 días de recibido el pedido.",
    "Los productos deben estar en su estado original, sin uso y con todas sus etiquetas.",
    "Los muebles de gran tamaño pueden tener un cargo de reposición.",
    "Los productos de venta final no admiten devolución.",
];

export default async function ReturnsPage() {
    const cms = await getCmsPage("returns-pages");
    const header = cmsHeader(cms, {
        badge: "Protocolo de Devoluciones",
        title: "Logística Inversa",
        highlight: "Devoluciones",
        subtitle:
            "Nos aseguramos de que estés satisfecho. Si un producto no cumple tus expectativas, tenés 30 días desde la entrega para devolverlo.",
    });
    const steps = cms?.steps?.length
        ? cms.steps.map((x: any) => x.text)
        : DEFAULT_STEPS;
    const policies = cms?.policies?.length
        ? cms.policies.map((x: any) => x.text)
        : DEFAULT_POLICIES;

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
                    <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
                        {header.subtitle}
                    </p>
                </header>

                <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    <div className="lg:col-span-5">
                        <Card className="t-card border-none shadow-2xl bg-card text-card-foreground overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                            <CardContent className="p-10">
                                <h2 className="text-3xl font-bold tracking-tight mb-10">
                                    Cómo Iniciar
                                </h2>
                                <div className="space-y-8">
                                    {steps.map((step: any, i: number) => (
                                        <div
                                            key={step}
                                            className="flex gap-6 group"
                                        >
                                            <span className="flex-shrink-0 size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-sm text-muted-foreground group-hover:text-foreground transition-colors pt-1.5">
                                                {step}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-7 space-y-16">
                        <div className="space-y-8">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                                Políticas
                            </h2>
                            <ul className="space-y-6">
                                {policies.map((text: string, _i: number) => (
                                    <li
                                        key={text}
                                        className="flex items-start gap-4 text-lg text-muted-foreground font-medium leading-relaxed group"
                                    >
                                        <CheckCircle2 className="size-6 text-primary shrink-0 mt-1 transition-transform group-hover:scale-110" />
                                        <span className="group-hover:text-foreground transition-colors">
                                            {text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-6 p-10 bg-muted/30 rounded-[2rem] border border-border/50">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                                Reembolsos
                            </h2>
                            <p className="text-lg text-foreground font-medium leading-relaxed italic">
                                Una vez recibido y validado el producto, el
                                reembolso se acredita en 5-7 días hábiles. Los
                                fondos se devuelven por el mismo medio de pago.
                                Los costos de envío no son reembolsables.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
