import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { cmsHeader, cmsRichText } from "@/lib/cms-page";

const getTermsData = createServerFn({ method: "GET" }).handler(async () => {
    const { getCmsPage } = await import("@/lib/strapi");
    const cms = await getCmsPage("terms-pages");
    return { cms };
});

const FALLBACK_HTML = `
<h2>1. Terminología y Acuerdo</h2><p>Al acceder o utilizar esta plataforma, aceptas estos Términos de Servicio. Si no estás de acuerdo con estas condiciones, no inicies sesión.</p>
<h2>2. Precios y Precisión</h2><p>Buscamos precisión en la representación de nuestros productos. Sin embargo, no podemos garantizar la reproducción exacta de colores en tu pantalla. Los precios son dinámicos y pueden actualizarse sin aviso previo.</p>
<h2>3. Devoluciones y Reembolsos</h2><p>El proceso de devolución tiene una ventana de 30 días. Los productos deben conservar su estado original para ser elegibles a reembolso. Los productos de venta final no admiten devolución.</p>
<h2>4. Responsabilidad</h2><p>No asumimos responsabilidad por fallas indirectas o incidentales derivadas del uso de los productos o de la inability de acceder a los servicios de la plataforma.</p>
`;

export const Route = createFileRoute("/_store/terms/")({
    loader: () => getTermsData(),
    head: ({ loaderData }) => ({
        meta: [
            { title: loaderData?.cms?.title ?? "Términos de Servicio" },
            {
                name: "description",
                content:
                    loaderData?.cms?.subtitle ??
                    "Nuestros términos y condiciones del servicio",
            },
        ],
    }),
    component: TermsRoute,
});

function TermsRoute() {
    const { cms } = Route.useLoaderData();
    const header = cmsHeader(cms, {
        badge: "Marco Legal",
        title: "Términos de",
        highlight: "Servicio",
        subtitle: "Nuestros términos y condiciones del servicio",
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
                    className="space-y-10"
                    dangerouslySetInnerHTML={{
                        __html: cmsRichText(cms?.content, FALLBACK_HTML),
                    }}
                />

                <footer className="pt-16 border-t border-border mt-20">
                    <p className="text-xs font-medium text-muted-foreground italic">
                        La utilización de esta plataforma constituye un
                        compromiso legal vinculante con los términos anteriores.
                    </p>
                </footer>
            </div>
        </div>
    );
}
