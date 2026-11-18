import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import SlidersTableClient from "@/components/admin/sliders/SlidersTableClient";

const getSlidersData = createServerFn({ method: "GET" }).handler(async () => {
    const [{ api }, { validateAdminAccess }] = await Promise.all([
        import("@/lib/api-client"),
        import("@/lib/server-auth"),
    ]);
    const { isValid } = await validateAdminAccess();
    if (!isValid) return { unauthorized: true as const };

    const sliders = (await api.get<any[]>(`/slide`).catch(() => [])) || [];
    const stats = {
        totalSliders: sliders.length,
        activeSliders: sliders.filter((s: any) => s.active).length,
        inactiveSliders: sliders.filter((s: any) => !s.active).length,
        withImages: sliders.filter((s: any) => !!s.img).length,
    };
    const pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: sliders.length,
        itemsPerPage: 100,
    };
    return { sliders, stats, pagination };
});

export const Route = createFileRoute("/_bookingAdmin/booking-admin/sliders/")({
    loader: async () => {
        const data = await getSlidersData();
        if ("unauthorized" in data) throw redirect({ to: "/login" });
        return data;
    },
    head: () => ({
        meta: [
            { title: "Carruseles" },
            {
                name: "description",
                content: "Panel de administración de reservas",
            },
        ],
    }),
    component: BookingAdminSlidersRoute,
});

function BookingAdminSlidersRoute() {
    const { sliders, stats, pagination } = Route.useLoaderData();
    return (
        <div className="container mx-auto py-8">
            <SlidersTableClient
                sliders={sliders}
                stats={stats}
                pagination={pagination}
            />
        </div>
    );
}
