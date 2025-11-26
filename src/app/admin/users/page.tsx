import React from "react";
import { cookies } from 'next/headers';
import UsersTableClient from "@/components/admin/users/UsersTableClient";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

type User = {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    avatar?: string;
    role?: {
        id: string;
        name: string;
    };
};

type Stats = {
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
};

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
};

async function getUsers(search: string, role: string, page: number, limit: number) {
    try {
        // Get cookies from request
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch from backend with cookies
        const response = await fetch(`${BACKEND_API_URL}/users`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch users:', response.status);
            return {
                users: [],
                stats: { totalUsers: 0, adminUsers: 0, regularUsers: 0 },
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit },
            };
        }

        const data = await response.json();

        // Map backend users to frontend format
        let users: User[] = [];
        if (data.success && data.data) {
            users = (Array.isArray(data.data) ? data.data : []).map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                isAdmin: u.role?.name === 'SUPER_ADMIN' || u.role?.name === 'ADMIN',
                avatar: u.profilePic || undefined,
                role: u.role ? {
                    id: u.role.id,
                    name: u.role.name,
                } : undefined,
            }));
        }

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
                users = users.filter((u) => u.isAdmin);
            } else if (role === "user") {
                users = users.filter((u) => !u.isAdmin);
            }
        }

        // Calculate stats
        const totalUsers = users.length;
        const adminUsers = users.filter((u) => u.isAdmin).length;
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
