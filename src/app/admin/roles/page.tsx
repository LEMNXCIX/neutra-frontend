import React from "react";
import { cookies } from 'next/headers';
import RolesTableClient from "@/components/admin/roles/RolesTableClient";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4001/api';

async function getRolesAndPermissions(rolePage: number, permissionPage: number) {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch roles (paginated)
        const rolesResponse = await fetch(`${BACKEND_API_URL}/roles?page=${rolePage}&limit=10`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
            },
            cache: 'no-store',
        });

        // Fetch permissions (paginated)
        const permissionsResponse = await fetch(`${BACKEND_API_URL}/permissions?page=${permissionPage}&limit=10`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
            },
            cache: 'no-store',
        });

        if (!rolesResponse.ok || !permissionsResponse.ok) {
            console.error('Failed to fetch roles or permissions');
            return {
                roles: [],
                permissions: [],
                stats: { totalRoles: 0, totalPermissions: 0 },
                rolePagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
                permissionPagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
            };
        }

        const rolesData = await rolesResponse.json();
        const permissionsData = await permissionsResponse.json();



        const roles = rolesData.success && rolesData.data ? rolesData.data : [];
        const permissions = permissionsData.success && permissionsData.data ? permissionsData.data : [];

        return {
            roles,
            permissions,
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

    const data = await getRolesAndPermissions(rolePage, permissionPage);

    return (
        <RolesTableClient
            roles={data.roles}
            permissions={data.permissions}
            stats={data.stats}
            rolePagination={data.rolePagination}
            permissionPagination={data.permissionPagination}
        />
    );
}
