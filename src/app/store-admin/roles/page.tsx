import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import RolesTableClient from "@/components/admin/roles/RolesTableClient";
import { Permission } from "@/types/permission.types";
import { Role } from "@/types/role.types";
import { api } from '@/lib/api-client';

export const metadata = { title: "Roles de la Tienda" };

export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
    try {
        const auth = await api.get<{ user: { role?: { name?: string } } }>('/auth/validate');
        if (auth?.user?.role?.name !== "SUPER_ADMIN") redirect("/");
    } catch (e) {
        if (e && typeof e === "object" && "digest" in (e as object)) throw e; // next redirect
        redirect("/login");
    }
}

const PER_PAGE = 10;

async function getRolesAndPermissions(
    rolePage: number,
    permissionPage: number,
    roleSearch?: string,
    permissionSearch?: string,
) {
    // Roles/permissions are small config lists: fetch complete (no page/limit)
    // and paginate client-side. The backend's paginated mode drops `total`,
    // so its metadata is unusable.
    try {
        const roleQueryParams = new URLSearchParams();
        if (roleSearch) roleQueryParams.set("search", roleSearch);

        const permQueryParams = new URLSearchParams();
        if (permissionSearch) permQueryParams.set("search", permissionSearch);

        const [rolesResult, permissionsResult] = await Promise.all([
            api.get<any>(`/roles?${roleQueryParams.toString()}`).catch(() => ({})),
            api.get<any>(`/permissions?${permQueryParams.toString()}`).catch(() => ({})),
        ]);

        const allRoles: Role[] = (
            Array.isArray(rolesResult) ? rolesResult : []
        ).map((r: any) => ({
            ...r,
            tenantId: r.tenantId || "",
        }));
        const allPermissions: Permission[] = Array.isArray(permissionsResult)
            ? permissionsResult
            : [];

        const roles = allRoles.slice((rolePage - 1) * PER_PAGE, rolePage * PER_PAGE);
        const permissions = allPermissions.slice((permissionPage - 1) * PER_PAGE, permissionPage * PER_PAGE);

        const buildPagination = (total: number, page: number) => ({
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
            totalItems: total,
            itemsPerPage: PER_PAGE,
        });

        return {
            roles,
            permissions,
            allPermissions,
            stats: {
                totalRoles: allRoles.length,
                totalPermissions: allPermissions.length,
            },
            rolePagination: buildPagination(allRoles.length, rolePage),
            permissionPagination: buildPagination(allPermissions.length, permissionPage),
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
}

type Props = {
    searchParams: Promise<{
        rolePage?: string;
        permissionPage?: string;
        roleSearch?: string;
        permissionSearch?: string;
    }>;
};

export default async function RolesPage({ searchParams }: Props) {
    await requireSuperAdmin();
    const resolvedSearchParams = await searchParams;
    const rolePage =
        typeof resolvedSearchParams.rolePage === "string"
            ? parseInt(resolvedSearchParams.rolePage)
            : 1;
    const permissionPage =
        typeof resolvedSearchParams.permissionPage === "string"
            ? parseInt(resolvedSearchParams.permissionPage)
            : 1;
    const roleSearch =
        typeof resolvedSearchParams.roleSearch === "string"
            ? resolvedSearchParams.roleSearch
            : undefined;
    const permissionSearch =
        typeof resolvedSearchParams.permissionSearch === "string"
            ? resolvedSearchParams.permissionSearch
            : undefined;

    const data = await getRolesAndPermissions(
        rolePage,
        permissionPage,
        roleSearch,
        permissionSearch,
    );

    return (
        <Suspense fallback={null}>
            <RolesTableClient
                roles={data.roles}
                permissions={data.permissions}
                allPermissions={data.allPermissions}
                stats={data.stats}
                rolePagination={data.rolePagination}
                permissionPagination={data.permissionPagination}
            />
        </Suspense>
    );
}
