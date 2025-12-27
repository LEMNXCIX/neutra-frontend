import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import StaffTableClient from "@/components/admin/booking/StaffTableClient";
import { bookingService } from "@/services/booking.service";

export default async function SuperAdminStaffPage({
    searchParams,
}: {
    searchParams: { tenantId?: string };
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("neutra_jwt")?.value;

    if (!token) {
        redirect("/login");
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    const tenantId = searchParams.tenantId === 'all' ? undefined : searchParams.tenantId;

    // Fetch data server-side
    const staff = await bookingService.getStaff(false, tenantId);

    return (
        <div className="container mx-auto py-8">
            <StaffTableClient
                staff={staff}
                isSuperAdmin={true}
            />
        </div>
    );
}
