import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import LogAnalyticsDashboard from "@/components/admin/LogAnalyticsDashboard";

const checkAdminAccess = createServerFn({ method: "GET" }).handler(async () => {
    const { validateAdminAccess } = await import("@/lib/server-auth");
    return validateAdminAccess();
});

export const Route = createFileRoute("/_admin/admin/")({
    loader: async () => {
        const { isValid } = await checkAdminAccess();
        if (!isValid) {
            throw redirect({ to: "/login" });
        }
        return { isValid };
    },
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: AdminRoute,
});

function AdminRoute() {
    return (
        <div className="space-y-12 pb-20">
            <div className="border-b border-border pb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight text-foreground leading-none">
                        Control Center
                    </h2>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-4">
                        Monitoreo global del sistema y gestión de tenants
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
                <section className="space-y-6">
                    <header className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border" />
                        <h3 className="font-semibold uppercase tracking-[0.3em] text-[10px] text-muted-foreground">
                            Indicadores del sistema
                        </h3>
                        <div className="h-px flex-1 bg-border" />
                    </header>
                    <LogAnalyticsDashboard />
                </section>
                <section className="p-8 t-card">
                    <h3 className="text-xl font-bold uppercase mb-4 tracking-tight">
                        Quick Actions
                    </h3>
                    <p className="text-muted-foreground font-medium mb-6">
                        Selecciona un módulo del menú lateral para gestionar los
                        tenants y la configuración global.
                    </p>
                </section>
            </div>
        </div>
    );
}
