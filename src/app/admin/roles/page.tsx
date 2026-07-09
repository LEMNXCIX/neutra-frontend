import React, { Suspense } from "react";
import RolesTableClient from "@/components/admin/roles/RolesTableClient";
import { Permission } from "@/types/permission.types";
import { api } from '@/lib/api-client';

export const dynamic = "force-dynamic";

async function getRolesAndPermissions(
    rolePage: number,
    permissionPage: number,
    roleSearch?: string,
    permissionSearch?: string,
) {
    try {
        const roleQuery = new URLSearchParams({ page: rolePage.toString(), limit: "10" });
        if (roleSearch) roleQuery.set("search", roleSearch);
        const permQuery = new URLSearchParams({ page: permissionPage.toString(), limit: "10" });
        if (permissionSearch) permQuery.set("search", permissionSearch);
        const [rolesResult, permissionsResult] = await Promise.all([
            api.get<any>(`/roles?${roleQuery.toString()}`).catch(() => ({})),
            api.get<any>(`/permissions?${permQuery.toString()}`).catch(() => ({})),
        ]);
        const roles = Array.isArray(rolesResult) ? rolesResult : [];
        const permissions = Array.isArray(permissionsResult) ? permissionsResult : [];

        let allPermissions: Permission[] = [];
        try {
            allPermissions = await api.get<any[]>('/permissions') || [];
        } catch (error) {
            console.error("Failed to fetch all permissions:", error);
        }

        return {
            roles,
            permissions,
            allPermissions,
            stats: {
                totalRoles: rolesResult?.pagination?.total || roles.length,
                totalPermissions: permissionsResult?.pagination?.total || permissions.length,
            },
            rolePagination: rolesResult?.pagination
                ? {
                    currentPage: rolesResult.pagination.page,
                    totalPages: rolesResult.pagination.totalPages,
                    totalItems: rolesResult.pagination.total,
                    itemsPerPage: rolesResult.pagination.limit,
                }
                : {
                    currentPage: rolePage,
                    totalPages: 1,
                    totalItems: roles.length,
                    itemsPerPage: 10,
                },
            permissionPagination: permissionsResult?.pagination
                ? {
                    currentPage: permissionsResult.pagination.page,
                    totalPages: permissionsResult.pagination.totalPages,
                    totalItems: permissionsResult.pagination.total,
                    itemsPerPage: permissionsResult.pagination.limit,
                }
                : {
                    currentPage: permissionPage,
                    totalPages: 1,
                    totalItems: permissions.length,
                    itemsPerPage: 10,
                },
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
