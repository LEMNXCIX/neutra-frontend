import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import UsersTableClient from "@/components/admin/users/UsersTableClient";

type Search = {
    page?: string;
    limit?: string;
    search?: string;
    role?: string;
};

const getUsersData = createServerFn({ method: "GET" })
    .validator((data: Search) => data)
    .handler(async ({ data }) => {
        const { api } = await import("@/lib/api-client");
        const page =
            typeof data.page === "string" ? parseInt(data.page, 10) : 1;
        const limit =
            typeof data.limit === "string" ? parseInt(data.limit, 10) : 10;
        const search = data.search ?? "";
        const roleParam = data.role ?? "all";
        const role =
            roleParam === "admin" || roleParam === "user" ? roleParam : "all";

        try {
            const backendUsers = await api.get<any[]>("/users").catch(() => []);
            const list = Array.isArray(backendUsers) ? backendUsers : [];
            let users: any[] = list.map((u: any) => {
                const tenantRole = u.role || u.tenants?.[0]?.role;
                const tenantInfo = u.tenant || u.tenants?.[0]?.tenant;
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    roleId: u.roleId || tenantRole?.id || "",
                    active: u.active !== undefined ? u.active : true,
                    profilePic: u.profilePic || undefined,
                    tenantId: u.tenantId || tenantInfo?.id || "",
                    role: tenantRole
                        ? {
                              id: tenantRole.id,
                              name: tenantRole.name,
                              permissions: tenantRole.permissions || [],
                          }
                        : u.roleId
                          ? { id: u.roleId, name: "USER", permissions: [] }
                          : undefined,
                    createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
                    updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
                    tenant: tenantInfo
                        ? {
                              id: tenantInfo.id,
                              name: tenantInfo.name,
                              slug: tenantInfo.slug,
                          }
                        : undefined,
                };
            });

            if (search) {
                const query = search.toLowerCase();
                users = users.filter(
                    (u) =>
                        u.name.toLowerCase().includes(query) ||
                        u.email.toLowerCase().includes(query) ||
                        u.id.toLowerCase().includes(query),
                );
            }
            if (role && role !== "all") {
                if (role === "admin") {
                    users = users.filter(
                        (u) =>
                            u.role?.name === "SUPER_ADMIN" ||
                            u.role?.name === "ADMIN",
                    );
                } else if (role === "user") {
                    users = users.filter(
                        (u) =>
                            u.role?.name !== "SUPER_ADMIN" &&
                            u.role?.name !== "ADMIN",
                    );
                }
            }

            const totalUsers = users.length;
            const adminUsers = users.filter(
                (u) =>
                    u.role?.name === "SUPER_ADMIN" || u.role?.name === "ADMIN",
            ).length;
            const startIndex = (page - 1) * limit;
            return {
                users: users.slice(startIndex, startIndex + limit),
                stats: {
                    totalUsers,
                    adminUsers,
                    regularUsers: totalUsers - adminUsers,
                },
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
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
    });

export const Route = createFileRoute("/_admin/admin/users/")({
    validateSearch: (search: Record<string, unknown>): Search => ({
        page: typeof search.page === "string" ? search.page : undefined,
        limit: typeof search.limit === "string" ? search.limit : undefined,
        search: typeof search.search === "string" ? search.search : undefined,
        role: typeof search.role === "string" ? search.role : undefined,
    }),
    loaderDeps: ({ search }) => ({
        page: search.page,
        limit: search.limit,
        search: search.search,
        role: search.role,
    }),
    loader: ({ deps }) => getUsersData({ data: deps }),
    head: () => ({
        meta: [
            { title: "Super Admin" },
            {
                name: "description",
                content: "Super administration dashboard",
            },
        ],
    }),
    component: AdminUsersRoute,
});

function AdminUsersRoute() {
    const { users, stats, pagination } = Route.useLoaderData();
    const rawRole = Route.useSearch().role;
    const initialRoleFilter =
        rawRole === "admin" || rawRole === "user" ? rawRole : "all";
    return (
        <UsersTableClient
            users={users}
            stats={stats}
            pagination={pagination}
            showTenant={true}
            initialRoleFilter={initialRoleFilter}
        />
    );
}
