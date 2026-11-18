import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { BookingNavbar } from "@/components/booking/booking-navbar";
import FooterWrapper from "@/components/footer-wrapper";
import { Navigation as StoreNavbar } from "@/components/nav_bar";
import { NeutralNavigation } from "@/components/neutral-navigation";
import { ProfileClient } from "@/components/profile/profile-client";
import type { Tenant } from "@/types/tenant";

/** Server-only profile data, reached through Start's server-fn boundary so
 *  cookie and auth helpers never enter the client bundle. */
const getProfileData = createServerFn({ method: "GET" }).handler(async () => {
    const [{ api }, { authService }, { getCookie, getRequestHeader }] =
        await Promise.all([
            import("@/lib/api-client"),
            import("@/services/auth.service"),
            import("@tanstack/react-start/server"),
        ]);

    try {
        const token = getCookie("token");
        if (!token) return null;

        const authRes = await authService.validate();
        const user = authRes?.user;
        if (!user) return null;

        // The server entry's Host-derived header is authoritative. Cookies can
        // be stale from another tenant; a missing header means root/superadmin.
        const headerSlug = getRequestHeader("x-tenant-slug");
        const tenantSlug = headerSlug || getCookie("tenant-slug") || "";
        const moduleType = getCookie("module-type") || "root";
        const isNeutral =
            !headerSlug ||
            headerSlug === "superadmin" ||
            moduleType === "root" ||
            tenantSlug === "superadmin";
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
});

export const Route = createFileRoute("/profile/")({
    loader: async () => {
        const data = await getProfileData();
        if (!data) {
            throw redirect({
                to: "/login",
                search: { redirect: "/profile" },
            });
        }
        return data;
    },
    head: () => ({
        meta: [
            { title: "Mi Perfil" },
            {
                name: "description",
                content:
                    "Gestiona la configuración y preferencias de tu cuenta",
            },
        ],
    }),
    component: ProfileRoute,
});

function ProfileRoute() {
    const { orders, appointments, myTenants, isNeutral, moduleType } =
        Route.useLoaderData();

    const content = (
        <main
            className={`flex-1 py-16 px-4 ${isNeutral ? "bg-gradient-to-b from-background to-muted/20" : "bg-background"}`}
        >
            <div className="max-w-6xl mx-auto space-y-12">
                <div
                    className={
                        isNeutral ? "text-center space-y-4" : "space-y-2"
                    }
                >
                    <h1
                        className={`font-bold tracking-tight text-foreground ${isNeutral ? "text-5xl md:text-7xl" : "text-4xl"}`}
                    >
                        {isNeutral
                            ? "Perfil de Usuario"
                            : "Resumen de la Cuenta"}
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        {isNeutral
                            ? "Gestiona tu seguridad y preferencias globales"
                            : "Revisa tu actividad reciente y la configuración de tu cuenta"}
                    </p>
                </div>

                <ProfileClient
                    initialOrders={orders}
                    initialAppointments={appointments}
                    myTenants={myTenants}
                    isNeutral={isNeutral}
                />
            </div>
        </main>
    );

    if (moduleType === "booking") {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <BookingNavbar />
                {content}
            </div>
        );
    }

    return (
        <div id="root-content" className="min-h-screen flex flex-col">
            {isNeutral ? <NeutralNavigation /> : <StoreNavbar />}
            <div className="pt-16 flex-1 bg-background">{content}</div>
            <FooterWrapper minimal={isNeutral} />
        </div>
    );
}
