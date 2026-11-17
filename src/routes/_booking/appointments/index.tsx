import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AppointmentsClient } from "@/components/booking/appointments-client";

const getInitialData = createServerFn({ method: "GET" }).handler(async () => {
    const [{ api }, { authService }] = await Promise.all([
        import("@/lib/api-client"),
        import("@/services/auth.service"),
    ]);

    try {
        const authRes = await authService.validate();
        const user = authRes?.user;
        if (!user) return null;

        const isStaff = user.role?.name === "STAFF";
        const requests: Promise<any>[] = [
            api.get<any[]>(`/appointments?userId=${user.id}`).catch(() => []),
        ];
        if (isStaff) {
            requests.push(api.get<any>("/staff/me").catch(() => null));
        }

        const results = await Promise.all(requests);
        const userAppointments = Array.isArray(results[0]) ? results[0] : [];
        let staffProfile = null;
        let staffAppointments: any[] = [];

        if (isStaff && results[1]) {
            staffProfile = results[1];
            if (staffProfile?.id) {
                staffAppointments =
                    (await api
                        .get<any[]>(`/appointments?staffId=${staffProfile.id}`)
                        .catch(() => [])) || [];
            }
        }

        return {
            user,
            userAppointments,
            staffProfile,
            staffAppointments,
            isStaff,
        };
    } catch (error) {
        console.error("Error fetching initial appointments data:", error);
        return null;
    }
});

export const Route = createFileRoute("/_booking/appointments/")({
    validateSearch: (
        search: Record<string, unknown>,
    ): { success?: string } => ({
        success:
            typeof search.success === "string" ? search.success : undefined,
    }),
    loader: async () => {
        const data = await getInitialData();
        if (!data) {
            throw redirect({
                to: "/login",
                search: { redirect: "/appointments" },
            });
        }
        return data;
    },
    head: () => ({
        meta: [
            { title: "Mis citas" },
            { name: "description", content: "Ver y gestionar tus citas" },
        ],
    }),
    component: AppointmentsRoute,
});

function AppointmentsRoute() {
    const { userAppointments, staffAppointments, staffProfile, isStaff } =
        Route.useLoaderData();
    const { success } = Route.useSearch();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                        Mis <span className="text-primary">citas</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {isStaff
                            ? "Gestiona tu agenda y reservas"
                            : "Gestiona tus citas próximas y pasadas"}
                    </p>
                </div>
                <AppointmentsClient
                    initialUserAppointments={userAppointments}
                    initialStaffAppointments={staffAppointments}
                    staffProfile={staffProfile}
                    isStaff={isStaff}
                    success={success}
                />
            </div>
        </div>
    );
}
