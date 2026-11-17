import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ArrowRight, CalendarDays } from "lucide-react";
import { BookingBanners } from "@/components/booking/booking-banners";
import { ServicesGrid } from "@/components/booking/services-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const getBookingHomeData = createServerFn({ method: "GET" }).handler(
    async () => {
        const [{ api }, { getTenantNameFromHeaders }, { getHomeContent }] =
            await Promise.all([
                import("@/lib/api-client"),
                import("@/lib/server-theme"),
                import("@/lib/strapi"),
            ]);

        const fetchServices = async (): Promise<any[]> => {
            try {
                return (
                    (await api.get<any[]>("/services?activeOnly=true")) || []
                );
            } catch {
                return [];
            }
        };

        const fetchSlides = async (): Promise<any[]> => {
            try {
                const data = await api.get<any>("/slide?activeOnly=true");
                if (Array.isArray(data)) return data;
                return data?.sliders || [];
            } catch {
                return [];
            }
        };

        const [services, cms, tenantName, slides] = await Promise.all([
            fetchServices(),
            getHomeContent(),
            getTenantNameFromHeaders(),
            fetchSlides(),
        ]);

        return { services, cms, tenantName, slides };
    },
);

export const Route = createFileRoute("/_booking/home/")({
    loader: () => getBookingHomeData(),
    head: () => ({
        meta: [
            { title: "Inicio" },
            { name: "description", content: "Reserva citas y servicios" },
        ],
    }),
    component: BookingHomeRoute,
});

function BookingHomeRoute() {
    const { services, cms, tenantName, slides } = Route.useLoaderData();
    const brandName = tenantName || "XCIX";

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
            <BookingBanners slides={slides} />

            <section className="relative overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-transparent" />
                <div className="relative max-w-5xl mx-auto px-6 text-center space-y-8">
                    <Badge
                        variant="secondary"
                        className="px-4 py-1 rounded-full"
                    >
                        {brandName}
                    </Badge>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                        {cms?.bookingHeroTitle ?? "Reserva tu"}{" "}
                        <span className="text-primary">
                            {cms?.bookingHeroHighlight ?? "Cita"}
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                        {cms?.bookingHeroSubtitle ??
                            "Reserva servicios profesionales de forma simple y online. Elige un servicio, selecciona un horario y listo."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-[color,background-color,border-color,box-shadow,opacity,transform]"
                            asChild
                        >
                            <Link to="/book">
                                {cms?.bookingCtaLabel ?? "Reservar Ahora"}
                                <ArrowRight className="ml-2 size-5" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-10 text-base font-bold rounded-xl border-border"
                            asChild
                        >
                            <Link to="/services">Ver Servicios</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="py-16 border-t border-border/50">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 text-muted-foreground mb-3">
                            <CalendarDays className="size-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                {cms?.servicesBadge ?? "Qué ofrecemos"}
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">
                            {cms?.servicesTitle ?? (
                                <>
                                    Nuestros{" "}
                                    <span className="text-primary">
                                        servicios
                                    </span>
                                </>
                            )}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {cms?.servicesSubtitle ??
                                "Elige entre nuestra gama de servicios profesionales adaptados a tus necesidades"}
                        </p>
                    </div>
                    <ServicesGrid services={services} />
                </div>
            </section>
        </div>
    );
}
