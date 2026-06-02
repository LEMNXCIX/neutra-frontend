import { backendFetch } from "@/lib/backend-api";
import type { Service } from "@/services/booking.service";
import AdminServicesPage from "./services-client";

export const metadata = { title: "Services Management" };

async function fetchServices(): Promise<Service[]> {
    try {
        const result = await backendFetch("/services?includeInactive=true", {
            cache: "no-store",
        });
        if (!result.success) return [];
        const data = result as any;
        return data.services || data.data?.services || data.data || [];
    } catch {
        return [];
    }
}

export default async function Page() {
    const initialServices = await fetchServices();
    return <AdminServicesPage initialServices={initialServices} />;
}
