import { NextRequest, NextResponse } from "next/server";
import { backendGet } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * GET /api/admin/users
 * Proxy to backend API for admin user management
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = extractTokenFromRequest(req);

    const [usersResult, statsResult] = await Promise.all([
      backendGet(`/users?${searchParams.toString()}`, token).catch(err => ({ success: false, error: err.message, data: [] })),
      backendGet('/users/stats/summary', token).catch(err => ({ success: false, error: err.message }))
    ]);

    if (!usersResult.success) {
      console.error("Backend returned unsuccessful response for users:", usersResult);
      return NextResponse.json(usersResult, { status: 500 });
    }

    const users = Array.isArray(usersResult.data) ? usersResult.data : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = statsResult.success && (statsResult as any).data ? (statsResult as any).data : {
      totalUsers: users.length,
      adminUsers: 0,
      regularUsers: users.length
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedUsers = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role, // Pass full role object
      isAdmin: u.role?.name === 'ADMIN' || u.role?.name === 'SUPER_ADMIN', // Updated check
      profilePic: u.profilePic, // Updated field name to match frontend expectation if needed, or keep avatar
      avatar: u.profilePic
    }));

    return NextResponse.json({
      users: mappedUsers,
      stats: {
        totalUsers: stats.totalUsers,
        adminUsers: stats.adminUsers,
        regularUsers: stats.regularUsers,
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: users.length,
        itemsPerPage: users.length,
      },
    });
  } catch (error) {
    console.error("Error fetching users from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user via backend
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/users/${userId}`;

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
