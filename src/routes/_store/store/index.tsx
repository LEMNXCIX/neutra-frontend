import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { StoreHomeClient } from "@/app/(store)/store/store-client";

/** Server-only storefront data, reached through Start's server-fn boundary so
 *  tenant-header and CMS helpers never enter the client bundle. */
const getStoreHomeData = createServerFn({ method: "GET" }).handler(async () => {
    const [{ api }, serverTheme, { getHomeContent }] = await Promise.all([
        import("@/lib/api-client"),
        import("@/lib/server-theme"),
        import("@/lib/strapi"),
    ]);

    const fetchSliders = async (): Promise<any[]> => {
        try {
            const data = await api.get<any>("/slide?activeOnly=true");
            if (Array.isArray(data)) return data;
            return data?.sliders || [];
        } catch {
            return [];
        }
    };

    const fetchFeaturedProducts = async (): Promise<any[]> => {
        try {
            const data = await api.get<any>("/products");
            const list = Array.isArray(data) ? data : data?.products || [];
            if (list && Array.isArray(list)) return list.slice(0, 4);
            return [];
        } catch {
            return [];
        }
    };

    const [sliders, featuredProducts, tenantName, cms] = await Promise.all([
        fetchSliders(),
        fetchFeaturedProducts(),
        serverTheme.getTenantNameFromHeaders(),
        getHomeContent(),
    ]);

    return { sliders, featuredProducts, tenantName, cms };
});

export const Route = createFileRoute("/_store/store/")({
    loader: () => getStoreHomeData(),
    head: () => ({
        meta: [
            { title: "Inicio" },
            {
                name: "description",
                content:
                    "Bienvenido a nuestra tienda: explora colecciones y productos destacados",
            },
        ],
    }),
    component: StoreHomeRoute,
});

function StoreHomeRoute() {
    const { sliders, featuredProducts, tenantName, cms } =
        Route.useLoaderData();
    return (
        <StoreHomeClient
            initialSliders={sliders}
            initialProducts={featuredProducts}
            tenantName={tenantName}
            cms={cms}
        />
    );
}
