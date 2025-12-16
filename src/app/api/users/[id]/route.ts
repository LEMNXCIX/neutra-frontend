
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * PUT /api/users/[id]
 * Proxy to backend API to update a user by ID
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const backendUrl = `${BACKEND_API_URL}/users/${id}`;

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

