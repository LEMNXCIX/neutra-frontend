import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { BookingWizard } from "@/components/booking/booking-wizard";

const getBookingWizardData = createServerFn({ method: "GET" }).handler(
    async () => {
        const { apiClient } = await import("@/lib/api-client");
        try {
            const [services, staff] = await Promise.all([
                apiClient<any[]>("/services?activeOnly=true"),
                apiClient<any[]>("/staff?activeOnly=true"),
            ]);
            return { services: services || [], staff: staff || [] };
        } catch (error) {
            console.error(
                "Error fetching booking wizard data on server:",
                error,
            );
            return { services: [], staff: [] };
        }
    },
);

export const Route = createFileRoute("/_booking/book/")({
    validateSearch: (
        search: Record<string, unknown>,
    ): { serviceId?: string } => ({
        serviceId:
            typeof search.serviceId === "string" ? search.serviceId : undefined,
    }),
    loaderDeps: ({ search }) => ({ serviceId: search.serviceId ?? "" }),
    loader: () => getBookingWizardData(),
    head: () => ({
        meta: [
            { title: "Reservar una Cita" },
            { name: "description", content: "Agenda tu próxima cita en línea" },
        ],
    }),
    component: BookRoute,
});

function BookRoute() {
    const { services, staff } = Route.useLoaderData();
    const { serviceId } = Route.useSearch();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                        Reservar una <span className="text-primary">cita</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Completa los pasos para programar tu cita
                    </p>
                </div>
                <BookingWizard
                    initialServices={services}
                    initialStaff={staff}
                    preSelectedServiceId={serviceId}
                />
            </div>
        </div>
    );
}
