import React from "react";
import { cookies } from 'next/headers';
import RolesTableClient from "@/components/admin/roles/RolesTableClient";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function getRolesAndPermissions() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch roles
        const rolesResponse = await fetch(`${BACKEND_API_URL}/roles`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
            },
            cache: 'no-store',
        });

        // Fetch permissions
        const permissionsResponse = await fetch(`${BACKEND_API_URL}/permissions`, {
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
                totalRoles: roles.length,
                totalPermissions: permissions.length,
            },
        };
    } catch (err) {
        console.error("Error fetching roles and permissions:", err);
        return {
            roles: [],
            permissions: [],
            stats: { totalRoles: 0, totalPermissions: 0 },
        };
    }
}

export default async function RolesPage() {
    const data = await getRolesAndPermissions();

    return (
        <RolesTableClient
            roles={data.roles}
            permissions={data.permissions}
            stats={data.stats}
        />
    );
}
