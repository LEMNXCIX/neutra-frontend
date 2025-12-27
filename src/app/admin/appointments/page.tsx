import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AppointmentsTableClient from "@/components/admin/appointments/AppointmentsTableClient";

export default async function AdminAppointmentsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
        redirect("/login");
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Global Appointments</h2>
            </div>
            <AppointmentsTableClient isSuperAdmin={true} />
        </div>
    );
}
