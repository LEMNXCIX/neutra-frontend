import React from "react";
import RolesTableClient from "@/components/admin/roles/RolesTableClient";
import { Permission } from "@/types/permission.types";
import { Role } from "@/types/role.types";
import { get as backendGet } from "../../../lib/backend-api";
import { extractTokenFromCookies, validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

async function getRolesAndPermissions(rolePage: number, permissionPage: number, roleSearch?: string, permissionSearch?: string) {
    try {
        const token = await extractTokenFromCookies() || undefined;

        // Build query parameters for roles
        const roleQueryParams = new URLSearchParams();
        roleQueryParams.set('page', rolePage.toString());
        roleQueryParams.set('limit', '10');
        if (roleSearch) roleQueryParams.set('search', roleSearch);

        // Build query parameters for permissions
        const permQueryParams = new URLSearchParams();
        permQueryParams.set('page', permissionPage.toString());
        permQueryParams.set('limit', '10');
        if (permissionSearch) permQueryParams.set('search', permissionSearch);

        // Fetch roles and permissions in parallel
        const [rolesResult, permissionsResult] = await Promise.all([
            backendGet(`/roles?${roleQueryParams.toString()}`, token),
            backendGet(`/permissions?${permQueryParams.toString()}`, token)
        ]);

        if (!rolesResult.success || !permissionsResult.success) {
            console.error('Failed to fetch roles or permissions:', rolesResult.error || permissionsResult.error);
            return {
                roles: [],
                permissions: [],
                allPermissions: [],
                stats: { totalRoles: 0, totalPermissions: 0 },
                rolePagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
                permissionPagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
            };
        }

        const roles = (Array.isArray(rolesResult.data) ? rolesResult.data : []).map((r: any) => ({
            ...r,
            tenantId: r.tenantId || '' // Ensure tenantId is present
        })) as Role[];
        const permissions = Array.isArray(permissionsResult.data) ? permissionsResult.data : [];

        // Fetch all permissions for selection in forms (non-paginated)
        let allPermissions: Permission[] = [];
        try {
            const allPermsResult = await backendGet('/permissions', token);
            if (allPermsResult.success) {
                allPermissions = Array.isArray(allPermsResult.data) ? allPermsResult.data : [];
            }
        } catch (error) {
            console.error("Failed to fetch all permissions:", error);
        }

        return {
            roles,
            permissions,
            allPermissions,
            stats: {
                totalRoles: (rolesResult as any).pagination?.total || roles.length,
                totalPermissions: (permissionsResult as any).pagination?.total || permissions.length,
            },
            rolePagination: (rolesResult as any).pagination ? {
                currentPage: (rolesResult as any).pagination.page,
                totalPages: (rolesResult as any).pagination.totalPages,
                totalItems: (rolesResult as any).pagination.total,
                itemsPerPage: (rolesResult as any).pagination.limit
            } : {
                currentPage: rolePage,
                totalPages: 1,
                totalItems: roles.length,
                itemsPerPage: 10
            },
            permissionPagination: (permissionsResult as any).pagination ? {
                currentPage: (permissionsResult as any).pagination.page,
                totalPages: (permissionsResult as any).pagination.totalPages,
                totalItems: (permissionsResult as any).pagination.total,
                itemsPerPage: (permissionsResult as any).pagination.limit
            } : {
                currentPage: permissionPage,
                totalPages: 1,
                totalItems: permissions.length,
                itemsPerPage: 10
            }
        };
    } catch (err) {
        console.error("Error fetching roles and permissions:", err);
        return {
            roles: [],
            permissions: [],
            allPermissions: [],
            stats: { totalRoles: 0, totalPermissions: 0 },
            rolePagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
            permissionPagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
        };
    }
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function RolesPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const rolePage = typeof resolvedSearchParams.rolePage === "string" ? parseInt(resolvedSearchParams.rolePage) : 1;
    const permissionPage = typeof resolvedSearchParams.permissionPage === "string" ? parseInt(resolvedSearchParams.permissionPage) : 1;
    const roleSearch = typeof resolvedSearchParams.roleSearch === "string" ? resolvedSearchParams.roleSearch : undefined;
    const permissionSearch = typeof resolvedSearchParams.permissionSearch === "string" ? resolvedSearchParams.permissionSearch : undefined;

    const data = await getRolesAndPermissions(rolePage, permissionPage, roleSearch, permissionSearch);

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
