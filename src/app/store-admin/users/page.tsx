import React from "react";
import UsersTableClient from "@/components/admin/users/UsersTableClient";
import { User } from "@/types/user.types";
import { Permission } from "@/types/permission.types";
import { get as backendGet } from "../../../lib/backend-api";
import { extractTokenFromCookies, validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

async function getUsers(search: string, role: string, page: number, limit: number) {
    try {
        const token = await extractTokenFromCookies();

        // Build query string for backend
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (role && role !== 'all') queryParams.set('role', role);
        queryParams.set('page', page.toString());
        queryParams.set('limit', limit.toString());

        const queryString = queryParams.toString();
        const usersUrl = queryString ? `/users?${queryString}` : '/users';

        // Fetch from backend
        const result = await backendGet(usersUrl, token as string | undefined);

        if (!result.success) {
            console.error('Failed to fetch users:', result.error);
            return {
                users: [],
                stats: { totalUsers: 0, adminUsers: 0, regularUsers: 0 },
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit },
            };
        }

        type BackendUser = {
            id: string;
            name: string;
            email: string;
            tenantId?: string; // Added tenantId as it's in User type
            roleId?: string;
            active?: boolean;
            profilePic?: string;
            role?: {
                id: string;
                name: string;
                permissions?: unknown[];
            };
            createdAt?: string;
            updatedAt?: string;
        };

        // Map backend users to frontend format
        const data = result.data as any;
        const backendUsers = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : []);

        let users: User[] = backendUsers.map((u: BackendUser) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            tenantId: '', // Default for now
            roleId: u.roleId || u.role?.id || '',
            active: u.active !== undefined ? u.active : true,
            profilePic: u.profilePic || undefined,
            role: u.role ? {
                id: u.role.id,
                name: u.role.name,
                description: null,
                level: 0,
                active: true,
                permissions: (u.role.permissions || []) as Permission[],
                createdAt: new Date(),
                updatedAt: new Date(),
            } : undefined,
            createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
            updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
        }));

        // Apply filters
        if (search) {
            const query = search.toLowerCase();
            users = users.filter(
                (u) =>
                    u.name.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query) ||
                    u.id.toLowerCase().includes(query)
            );
        }

        if (role && role !== "all") {
            if (role === "admin") {
                users = users.filter((u) => u.role?.name === 'SUPER_ADMIN' || u.role?.name === 'ADMIN');
            } else if (role === "user") {
                users = users.filter((u) => u.role?.name !== 'SUPER_ADMIN' && u.role?.name !== 'ADMIN');
            }
        }

        // Calculate stats
        const totalUsers = users.length;
        const adminUsers = users.filter((u) => u.role?.name === 'SUPER_ADMIN' || u.role?.name === 'ADMIN').length;
        const regularUsers = totalUsers - adminUsers;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = users.slice(startIndex, endIndex);
        const totalPages = Math.ceil(totalUsers / limit);

        return {
            users: paginatedUsers,
            stats: {
                totalUsers,
                adminUsers,
                regularUsers,
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalUsers,
                itemsPerPage: limit,
            },
        };
    } catch (err) {
        console.error("Error fetching users:", err);
        return {
            users: [],
            stats: { totalUsers: 0, adminUsers: 0, regularUsers: 0 },
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit,
            },
        };
    }
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function UsersPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const role = typeof resolvedSearchParams.role === "string" ? resolvedSearchParams.role : "all";

    const data = await getUsers(search, role, page, limit);

    return (
        <UsersTableClient
            users={data.users}
            stats={data.stats}
            pagination={data.pagination}
        />
    );
}
