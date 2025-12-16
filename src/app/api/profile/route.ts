import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * GET /api/profile
 * Proxy to backend API for user profile
 */
export async function GET(req: NextRequest) {
    try {
        const backendUrl = `${BACKEND_API_URL}/auth/validate`;

        const response = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
            },
            cache: "no-store",
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 401 }
        );
    }
}

/**
 * PUT /api/profile
 * Proxy to backend API to update user profile
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();

        // First get current user ID
        const validateUrl = `${BACKEND_API_URL}/auth/validate`;
        const validateResponse = await fetch(validateUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
            },
            cache: "no-store",
        });

        const validateData = await validateResponse.json();

        if (!validateData.success || !validateData.data?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = validateData.data.user.id;
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
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
