import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import RolesTableClient from "@/components/admin/roles/RolesTableClient";
import { Permission } from "@/types/permission.types";
import { api } from '@/lib/api-client';
import { validateAdminAccess } from '@/lib/server-auth';

export const metadata = { title: "Roles de reservas" };

export const dynamic = "force-dynamic";

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
        const roleParams = new URLSearchParams();
        if (roleSearch) roleParams.set("search", roleSearch);
        const permParams = new URLSearchParams();
        if (permissionSearch) permParams.set("search", permissionSearch);

        const [rolesResult, permissionsResult] = await Promise.all([
            api.get<any>(`/roles?${roleParams.toString()}`).catch(() => ({})),
            api.get<any>(`/permissions?${permParams.toString()}`).catch(() => ({})),
        ]);

        const allRoles: any[] = rolesResult?.data || (Array.isArray(rolesResult) ? rolesResult : []);
        const allPermissions: Permission[] = permissionsResult?.data || (Array.isArray(permissionsResult) ? permissionsResult : []);

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
    const { isValid } = await validateAdminAccess();
    if (!isValid) redirect("/login");
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
