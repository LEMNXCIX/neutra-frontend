import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const approveAppointment = createServerFn({ method: "POST" })
    .validator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        const { apiClient } = await import("@/lib/api-client");
        try {
            await apiClient(`/appointments/${data.id}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: "CONFIRMED" }),
            });
        } catch (error) {
            console.error("Error approving appointment:", error);
        }
    });

export const Route = createFileRoute(
    "/_bookingAdmin/booking-admin/appointments/$id/approve/",
)({
    loader: async ({ params, preload }) => {
        // Intent preload must never commit the status change.
        if (preload) return;
        await approveAppointment({ data: { id: params.id } });
        throw redirect({ to: "/booking-admin/appointments" });
    },
    head: () => ({
        meta: [
            { title: "Aprobar cita" },
            {
                name: "description",
                content: "Procesando la aprobación de la cita",
            },
        ],
    }),
    component: AppointmentApproveRoute,
});

function AppointmentApproveRoute() {
    return <div />;
}
