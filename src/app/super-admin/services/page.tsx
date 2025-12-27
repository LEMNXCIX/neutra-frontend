import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import ServicesTableClient from "@/components/admin/booking/ServicesTableClient";
import { bookingService } from "@/services/booking.service";
import { categoriesService } from "@/services/categories.service";

export default async function SuperAdminServicesPage({
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
    const [services, categories] = await Promise.all([
        bookingService.getServices(false, tenantId),
        categoriesService.getAll(undefined, undefined, 'SERVICE')
    ]);

    return (
        <div className="container mx-auto py-8">
            <ServicesTableClient
                services={services}
                categories={categories}
                isSuperAdmin={true}
            />
        </div>
    );
}
