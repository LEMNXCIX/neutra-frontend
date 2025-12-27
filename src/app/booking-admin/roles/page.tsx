import React from "react";
import { cookies } from 'next/headers';
import RolesTableClient from "@/components/admin/roles/RolesTableClient";
import { Permission } from "@/types/permission.types";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getRolesAndPermissions(rolePage: number, permissionPage: number, roleSearch?: string, permissionSearch?: string) {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';

        // Fetch roles (paginated)
        const roleUrl = new URL(`${BACKEND_API_URL}/roles`);
        roleUrl.searchParams.set('page', rolePage.toString());
        roleUrl.searchParams.set('limit', '10');
        if (roleSearch) roleUrl.searchParams.set('search', roleSearch);

        const rolesResponse = await fetch(roleUrl.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
                'x-tenant-slug': tenantSlug,
            },
            cache: 'no-store',
        });

        // Fetch permissions (paginated)
        const permUrl = new URL(`${BACKEND_API_URL}/permissions`);
        permUrl.searchParams.set('page', permissionPage.toString());
        permUrl.searchParams.set('limit', '10');
        if (permissionSearch) permUrl.searchParams.set('search', permissionSearch);

        const permissionsResponse = await fetch(permUrl.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
                'x-tenant-slug': tenantSlug,
            },
            cache: 'no-store',
        });

        if (!rolesResponse.ok || !permissionsResponse.ok) {
            console.error('Failed to fetch roles or permissions:', {
                rolesStatus: rolesResponse.status,
                permsStatus: permissionsResponse.status,
                apiUrl: BACKEND_API_URL,
                tenantSlug
            });
            return {
                roles: [],
                permissions: [],
                allPermissions: [],
                stats: { totalRoles: 0, totalPermissions: 0 },
                rolePagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
                permissionPagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
            };
        }

        const rolesData = await rolesResponse.json();
        const permissionsData = await permissionsResponse.json();



        const roles = rolesData.success && rolesData.data ? rolesData.data : [];
        const permissions = permissionsData.success && permissionsData.data ? permissionsData.data : [];

        // Fetch all permissions for selection in forms (non-paginated)
        let allPermissions: Permission[] = [];
        try {
            const allPermsResponse = await fetch(`${BACKEND_API_URL}/permissions`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookieString,
                    'x-tenant-slug': tenantSlug,
                },
                cache: 'no-store',
            });
            if (allPermsResponse.ok) {
                const allPermsData = await allPermsResponse.json();
                allPermissions = allPermsData.success && allPermsData.data ? allPermsData.data : [];
            }
        } catch (error) {
            console.error("Failed to fetch all permissions:", error);
        }

        return {
            roles,
            permissions,
            allPermissions,
            stats: {
                totalRoles: rolesData.pagination?.total || roles.length,
                totalPermissions: permissionsData.pagination?.total || permissions.length,
            },
            rolePagination: rolesData.pagination ? {
                currentPage: rolesData.pagination.page,
                totalPages: rolesData.pagination.totalPages,
                totalItems: rolesData.pagination.total,
                itemsPerPage: rolesData.pagination.limit
            } : {
                currentPage: rolePage,
                totalPages: 1,
                totalItems: roles.length,
                itemsPerPage: 10
            },
            permissionPagination: permissionsData.pagination ? {
                currentPage: permissionsData.pagination.page,
                totalPages: permissionsData.pagination.totalPages,
                totalItems: permissionsData.pagination.total,
                itemsPerPage: permissionsData.pagination.limit
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
