import React from "react";
import { Badge } from "@/components/ui/badge";
import { getCmsPage } from "@/lib/strapi";
import { cmsHeader, cmsRichText } from "@/lib/cms-page";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const cms = await getCmsPage("privacy-pages");
    return {
        title: cms?.title ?? "Política de Privacidad",
        description: cms?.subtitle ?? "Nuestra política de privacidad y manejo de datos",
    };
}

const FALLBACK_HTML = `
<p>Recopilamos los datos brindados durante el registro, la sesión y la compra. Esto incluye identificadores, direcciones de correo y tokens de transacción seguros.</p>
<p>Los datos recopilados se utilizan para optimizar la logística, facilitar la comunicación sobre el estado de tus pedidos y fortalecer la integridad de la red contra operaciones fraudulentas.</p>
<p>Implementamos protocolos de encriptación avanzados para proteger tu identidad. La integridad de los datos es un componente central de nuestra arquitectura.</p>
<p>Utilizamos cookies temporales para mejorar el rendimiento de la sesión y analizar patrones de tráfico. Vos mantenés el control sobre estos parámetros desde la configuración de tu navegador.</p>
`;

export default async function PrivacyPage() {
    const cms = await getCmsPage("privacy-pages");
    const header = cmsHeader(cms, {
        badge: "Estándares de Datos",
        title: "Privacidad",
        highlight: "y Datos",
        subtitle: "Nuestra política de privacidad y manejo de datos",
    });

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

                <div
                    className="space-y-6 text-lg text-muted-foreground font-medium"
                    dangerouslySetInnerHTML={{
                        __html: cmsRichText(cms?.content, FALLBACK_HTML),
                    }}
                />
            </div>
        </div>
    );
}
