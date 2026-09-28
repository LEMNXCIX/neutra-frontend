import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/profile-client";
import { api } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import type { Tenant } from "@/types/tenant";

export const metadata: Metadata = {
    title: "Mi Perfil",
    description: "Gestiona la configuración y preferencias de tu cuenta",
};

export const dynamic = "force-dynamic";

async function getData() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const tenantSlug = cookieStore.get("tenant-slug")?.value || "";
        const moduleType = cookieStore.get("module-type")?.value || "root";

        if (!token) return null;

        const authRes = await authService.validate();
        const user = authRes?.user;
        if (!user) return null;

        const isNeutral = moduleType === "root" || tenantSlug === "superadmin";
        const requests: Promise<any>[] = [];

        if (moduleType === "store") {
            requests.push(
                api.get<any[]>("/order/getOrderByUser").catch(() => []),
            );
        } else if (moduleType === "booking") {
            requests.push(
                api
                    .get<any[]>(`/appointments?userId=${user.id}`)
                    .catch(() => []),
            );
        }

        const results = await Promise.all(requests);

        // Neutral/SuperAdmin surface: only the tenants the user actually belongs to.
        const myTenants = isNeutral
            ? await api.get<Tenant[]>("/tenants/mine").catch(() => [])
            : [];

        return {
            user,
            orders:
                moduleType === "store"
                    ? Array.isArray(results[0])
                        ? results[0]
                        : []
                    : [],
            appointments:
                moduleType === "booking"
                    ? Array.isArray(results[0])
                        ? results[0]
                        : []
                    : [],
            myTenants: Array.isArray(myTenants) ? myTenants : [],
            isNeutral,
            moduleType,
        };
    } catch (error) {
        console.error(
            "Error al cargar los datos del perfil en el servidor:",
            error,
        );
        return null;
    }
}

export default async function ProfilePage() {
    const data = await getData();

    if (!data) {
        redirect("/login?redirect=/profile");
    }

    return (
        <main
            className={`min-h-screen py-16 px-4 ${data.isNeutral ? "bg-gradient-to-b from-background to-muted/20" : "bg-background"}`}
        >
            <div className="max-w-6xl mx-auto space-y-12">
                <div
                    className={
                        data.isNeutral ? "text-center space-y-4" : "space-y-2"
                    }
                >
                    <h1
                        className={`font-bold tracking-tight text-foreground ${data.isNeutral ? "text-5xl md:text-7xl" : "text-4xl"}`}
                    >
                        {data.isNeutral
                            ? "Perfil de Usuario"
                            : "Resumen de la Cuenta"}
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        {data.isNeutral
                            ? "Gestiona tu seguridad y preferencias globales"
                            : "Revisa tu actividad reciente y la configuración de tu cuenta"}
                    </p>
                </div>

                <ProfileClient
                    initialOrders={data.orders}
                    initialAppointments={data.appointments}
                    myTenants={data.myTenants}
                    isNeutral={data.isNeutral}
                />
            </div>
        </main>
    );
}
