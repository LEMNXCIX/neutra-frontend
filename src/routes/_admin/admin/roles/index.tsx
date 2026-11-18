import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import RolesTableClient from "@/components/admin/roles/RolesTableClient";
import type { Permission } from "@/types/permission.types";

const PER_PAGE = 10;

type Search = {
    rolePage?: string;
    permissionPage?: string;
    roleSearch?: string;
    permissionSearch?: string;
};

const getRolesAndPermissions = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const { api } = await import("@/lib/api-client");
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
            const roleQuery = new URLSearchParams();
            if (data.roleSearch) roleQuery.set("search", data.roleSearch);
            const permQuery = new URLSearchParams();
            if (data.permissionSearch)
                permQuery.set("search", data.permissionSearch);
            const [rolesResult, permissionsResult] = await Promise.all([
                api
                    .get<any>(`/roles?${roleQuery.toString()}`)
                    .catch(() => ({})),
                api
                    .get<any>(`/permissions?${permQuery.toString()}`)
                    .catch(() => ({})),
            ]);
            const allRoles = Array.isArray(rolesResult) ? rolesResult : [];
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

export const Route = createFileRoute("/_admin/admin/roles/")({
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
    loader: ({ deps }) => getRolesAndPermissions({ data: deps }),
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: AdminRolesRoute,
});

function AdminRolesRoute() {
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
