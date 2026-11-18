import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ServicesGrid } from "@/components/booking/services-grid";
import { Badge } from "@/components/ui/badge";

const getBookingServicesData = createServerFn({ method: "GET" }).handler(
    async () => {
        const [{ api }, { getHomeContent }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/lib/strapi"),
        ]);

        const fetchServices = async (): Promise<any[]> => {
            try {
                return (
                    (await api.get<any[]>("/services?activeOnly=true")) || []
                );
            } catch (err) {
                console.error("Error loading services on server:", err);
                return [];
            }
        };

        const [services, cms] = await Promise.all([
            fetchServices(),
            getHomeContent(),
        ]);
        return { services, cms };
    },
);

export const Route = createFileRoute("/_booking/services/")({
    loader: () => getBookingServicesData(),
    head: () => ({
        meta: [
            { title: "Servicios" },
            {
                name: "description",
                content: "Explora los servicios disponibles para reservar",
            },
        ],
    }),
    component: BookingServicesRoute,
});

function BookingServicesRoute() {
    const { services, cms } = Route.useLoaderData();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="mb-12 text-center">
                    <Badge variant="outline" className="mb-4">
                        Servicios profesionales
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                        {cms?.servicesTitle ?? (
                            <>
                                Nuestros{" "}
                                <span className="text-primary">servicios</span>
                            </>
                        )}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {cms?.servicesSubtitle ??
                            "Elige entre nuestra gama de servicios profesionales adaptados a tus necesidades"}
                    </p>
                </div>
                <ServicesGrid services={services} />
            </div>
        </div>
    );
}
