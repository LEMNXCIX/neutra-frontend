import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import CouponsTableClient from "@/components/admin/coupons/CouponsTableClient";
import { couponsService } from "@/services/coupons.service";

export default async function SuperAdminCouponsPage({
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
    const coupons = await couponsService.getAll(tenantId);

    return (
        <div className="container mx-auto py-8">
            <CouponsTableClient
                coupons={coupons}
                isSuperAdmin={true}
            />
        </div>
    );
}
