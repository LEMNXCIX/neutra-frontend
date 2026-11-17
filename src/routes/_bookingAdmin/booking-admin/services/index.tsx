import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import ServicesTableClient from "@/components/admin/booking/ServicesTableClient";

const getServicesData = createServerFn({ method: "GET" }).handler(async () => {
    const { api } = await import("@/lib/api-client");
    try {
        const [servicesData, categoriesData] = await Promise.all([
            api.get<any[]>(`/services?activeOnly=false`).catch(() => []),
            api.get<any[]>("/categories").catch(() => []),
        ]);
        return {
            services: Array.isArray(servicesData) ? servicesData : [],
            categories: Array.isArray(categoriesData) ? categoriesData : [],
        };
    } catch (err) {
        console.error("Error fetching services data:", err);
        return { services: [], categories: [] };
    }
});

export const Route = createFileRoute("/_bookingAdmin/booking-admin/services/")({
    loader: () => getServicesData(),
    head: () => ({
        meta: [
            { title: "Servicios de reservas" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: BookingAdminServicesRoute,
});

function BookingAdminServicesRoute() {
    const { services, categories } = Route.useLoaderData();
    return (
        <div className="p-6">
            <ServicesTableClient services={services} categories={categories} />
        </div>
    );
}
