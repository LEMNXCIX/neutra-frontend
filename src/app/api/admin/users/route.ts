import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * GET /api/admin/users
 * Proxy to backend API for admin user management
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const backendUrl = `${BACKEND_API_URL}/users?${searchParams.toString()}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      cache: "no-store",
    });

    const data = await response.json();

    // Transform backend response to match expected format
    if (data.success && data.data) {
      const users = Array.isArray(data.data) ? data.data : [];

      // Calculate stats
      const totalUsers = users.length;
      const adminUsers = users.filter((u: any) => u.role?.name === 'admin').length;
      const regularUsers = totalUsers - adminUsers;

      return NextResponse.json({
        users: users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          isAdmin: u.role?.name === 'admin',
          avatar: u.profilePic,
        })),
        stats: {
          totalUsers,
          adminUsers,
          regularUsers,
        },
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: totalUsers,
          itemsPerPage: totalUsers,
        },
      });
    }

    return NextResponse.json(data, { status: response.status });
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
