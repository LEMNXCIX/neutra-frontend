import React from "react";
import UsersTableClient from "@/components/admin/users/UsersTableClient";

type User = {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    avatar?: string;
};

async function getUsers(search: string, role: string, page: number, limit: number) {
    try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (role && role !== "all") params.set("role", role);
        params.set("page", page.toString());
        params.set("limit", limit.toString());

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/users?${params.toString()}`, {
            cache: "no-store",
            credentials: "same-origin",
        });

        if (!res.ok) {
            console.error("Failed to fetch users");
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

        const data = await res.json();

        return {
            users: data.users || [],
            stats: data.stats || { totalUsers: 0, adminUsers: 0, regularUsers: 0 },
            pagination: data.pagination || {
                currentPage: page,
                totalPages: 0,
                totalItems: 0,
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
