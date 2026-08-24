import { api } from "@/lib/api-client";
import { Tenant, CreateTenantData, UpdateTenantData } from "@/types/tenant";

export const tenantService = {
    getAll: async () => {
        return api.get<Tenant[]>('/tenants');
    },

    getBySlug: async (slug: string): Promise<Tenant | null> => {
        // Server-side (RSC): hit the backend directly; relative URLs don't resolve.
        const base =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
        const apiUrl = base.endsWith("/api") ? base : `${base}/api`;
        const url =
            typeof window === "undefined"
                ? `${apiUrl}/tenants/config/${encodeURIComponent(slug)}`
                : `/api/tenants/config/${encodeURIComponent(slug)}`;

        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return null;
        const result = await response.json().catch(() => null);
        return result?.data ?? null;
    },

    getAvailableFeatures: async (): Promise<any[]> => {
        const response: any = await api.get('/features');
        // Ensure we return an array
        return Array.isArray(response) ? response : (response.data || []);
    },

    create: async (payload: CreateTenantData) => {
        return api.post<Tenant>('/tenants', payload);
    },

    update: async (id: string, payload: UpdateTenantData) => {
        return api.put<Tenant>(`/tenants/${id}`, payload);
    },

    getFeatures: async (id: string) => {
        return api.get<any>(`/tenants/${id}/features`);
    },

    updateFeatures: async (id: string, features: any) => {
        // Backend DTO expects { features: {...} }, not the bare map
        return api.put<any>(`/tenants/${id}/features`, { features });
    },

    delete: async (id: string) => {
        return api.delete(`/tenants/${id}`);
    }
};

