import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import RolesTableClient from "@/components/admin/roles/RolesTableClient";
import type { Permission } from "@/types/permission.types";
import type { Role } from "@/types/role.types";

const PER_PAGE = 10;

type Search = {
    rolePage?: string;
    permissionPage?: string;
    roleSearch?: string;
    permissionSearch?: string;
};

const getStoreRolesData = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const [{ api }, { validateAdminAccess }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/lib/server-auth"),
        ]);
        const { isValid } = await validateAdminAccess();
        if (!isValid) return { unauthorized: true as const };

        const rolePage =
            typeof data.rolePage === "string" ? parseInt(data.rolePage, 10) : 1;
        const permissionPage =
            typeof data.permissionPage === "string"
                ? parseInt(data.permissionPage, 10)
                : 1;

        // Roles/permissions are small config lists: fetch complete (no
        // page/limit) and paginate client-side. The backend's paginated mode
        // drops `total`, so its metadata is unusable.
        try {
            const roleQueryParams = new URLSearchParams();
            if (data.roleSearch) roleQueryParams.set("search", data.roleSearch);
            const permQueryParams = new URLSearchParams();
            if (data.permissionSearch)
                permQueryParams.set("search", data.permissionSearch);
            const [rolesResult, permissionsResult] = await Promise.all([
                api
                    .get<any>(`/roles?${roleQueryParams.toString()}`)
                    .catch(() => ({})),
                api
                    .get<any>(`/permissions?${permQueryParams.toString()}`)
                    .catch(() => ({})),
            ]);
            const allRoles: Role[] = (
                Array.isArray(rolesResult) ? rolesResult : []
            ).map((r: any) => ({ ...r, tenantId: r.tenantId || "" }));
            const allPermissions: Permission[] = Array.isArray(
                permissionsResult,
            )
                ? permissionsResult
                : [];
            const buildPagination = (total: number, page: number) => ({
                currentPage: page,
                totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
                totalItems: total,
                itemsPerPage: PER_PAGE,
            });
            return {
                roles: allRoles.slice(
                    (rolePage - 1) * PER_PAGE,
                    rolePage * PER_PAGE,
                ),
                permissions: allPermissions.slice(
                    (permissionPage - 1) * PER_PAGE,
                    permissionPage * PER_PAGE,
                ),
                allPermissions,
                stats: {
                    totalRoles: allRoles.length,
                    totalPermissions: allPermissions.length,
                },
                rolePagination: buildPagination(allRoles.length, rolePage),
                permissionPagination: buildPagination(
                    allPermissions.length,
                    permissionPage,
                ),
            };
        } catch (err) {
            console.error("Error fetching roles and permissions:", err);
            return {
                roles: [],
                permissions: [],
                allPermissions: [],
                stats: { totalRoles: 0, totalPermissions: 0 },
                rolePagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: 10,
                },
                permissionPagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: 10,
                },
            };
        }
    });

export const Route = createFileRoute("/_storeAdmin/store-admin/roles/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        rolePage:
            typeof search.rolePage === "string" ? search.rolePage : undefined,
        permissionPage:
            typeof search.permissionPage === "string"
                ? search.permissionPage
                : undefined,
        roleSearch:
            typeof search.roleSearch === "string"
                ? search.roleSearch
                : undefined,
        permissionSearch:
            typeof search.permissionSearch === "string"
                ? search.permissionSearch
                : undefined,
    }),
    loaderDeps: ({ search }) => ({
        rolePage: search.rolePage,
        permissionPage: search.permissionPage,
        roleSearch: search.roleSearch,
        permissionSearch: search.permissionSearch,
    }),
    loader: async ({ deps }) => {
        const result = await getStoreRolesData({ data: deps });
        if ("unauthorized" in result) throw redirect({ to: "/login" });
        return result;
    },
    head: () => ({
        meta: [
            { title: "Roles de tienda" },
            {
                name: "description",
                content: "Panel de administración de la tienda",
            },
        ],
    }),
    component: StoreAdminRolesRoute,
});

function StoreAdminRolesRoute() {
    const data = Route.useLoaderData();
    return (
        <RolesTableClient
            roles={data.roles}
            permissions={data.permissions}
            allPermissions={data.allPermissions}
            stats={data.stats}
            rolePagination={data.rolePagination}
            permissionPagination={data.permissionPagination}
        />
    );
}
