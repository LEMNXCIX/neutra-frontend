import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsChartsDetailed from "@/components/admin/AnalyticsChartsDetailed";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";

const getStoreAdminData = createServerFn({ method: "GET" }).handler(
    async () => {
        const [{ api }, { getCookie }] = await Promise.all([
            import("@/lib/api-client"),
            import("@tanstack/react-start/server"),
        ]);

        let isValid = false;
        try {
            if (getCookie("token")) {
                const authRes = await api.get<{ user: any }>("/auth/validate");
                const user = authRes?.user;
                isValid =
                    user?.role?.name === "SUPER_ADMIN" ||
                    user?.role?.name === "ADMIN";
            }
        } catch (error) {
            console.error("Admin validation error:", error);
        }
        if (!isValid) return { unauthorized: true as const };

        let initialOrders: any[] = [];
        try {
            const result = await api.get<any>("/order");
            initialOrders = result.orders || [];
        } catch {}
        return { initialOrders };
    },
);

export const Route = createFileRoute("/_storeAdmin/store-admin/")({
    loader: async () => {
        const data = await getStoreAdminData();
        if ("unauthorized" in data) throw redirect({ to: "/login" });
        return data;
    },
    head: () => ({
        meta: [
            { title: "Administración de la Tienda" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: StoreAdminRoute,
});

function StoreAdminRoute() {
    const { initialOrders } = Route.useLoaderData();
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold capitalize">
                Panel de tienda
            </h2>
            <AnalyticsOverview />
            <AnalyticsCharts initialOrders={initialOrders} />
            <AnalyticsChartsDetailed />
        </div>
    );
}
