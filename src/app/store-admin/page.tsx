import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsChartsDetailed from "@/components/admin/AnalyticsChartsDetailed";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import { api } from "@/lib/api-client";

export const metadata = { title: "Administración de la Tienda" };

export const dynamic = "force-dynamic";

async function validateAdminAccess() {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get("token");

        if (!tokenCookie) {
            return { isValid: false, user: null };
        }

        const authRes = await api.get<{ user: any }>("/auth/validate");

        if (!authRes?.user) {
            return { isValid: false, user: null };
        }

        const user = authRes.user;

        const isAdmin =
            user.role?.name === "SUPER_ADMIN" || user.role?.name === "ADMIN";

        return { isValid: isAdmin, user };
    } catch (error) {
        console.error("Admin validation error:", error);
        return { isValid: false, user: null };
    }
}

export default async function AdminPage() {
    const { isValid } = await validateAdminAccess();

    if (!isValid) {
        redirect("/login");
    }

    let initialOrders: any[] = [];
    try {
        const result = await api.get<any>("/order");
        initialOrders = result.orders || [];
    } catch {}

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
