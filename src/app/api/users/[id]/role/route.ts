
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * PUT /api/users/[id]/role
 * Proxy to backend API to assign a role to a user
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const backendUrl = `${BACKEND_API_URL}/users/${id}/role`;

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
        console.error("Error assigning role to user:", error);
        return NextResponse.json(
            { error: "Failed to assign role to user" },
            { status: 500 }
        );
    }
}

