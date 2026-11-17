import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import StaffTableClient from "@/components/admin/booking/StaffTableClient";

const getStaffData = createServerFn({ method: "GET" }).handler(async () => {
    const { api } = await import("@/lib/api-client");
    try {
        const data = await api.get<any[]>("/staff?activeOnly=false");
        return { staff: Array.isArray(data) ? data : [] };
    } catch (err) {
        console.error("Error fetching staff:", err);
        return { staff: [] };
    }
});

export const Route = createFileRoute("/_bookingAdmin/booking-admin/staff/")({
    loader: () => getStaffData(),
    head: () => ({
        meta: [
            { title: "Personal de reservas" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: BookingAdminStaffRoute,
});

function BookingAdminStaffRoute() {
    const { staff } = Route.useLoaderData();
    return (
        <div className="p-6">
            <StaffTableClient staff={staff} />
        </div>
    );
}
