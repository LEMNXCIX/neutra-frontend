import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * POST /api/auth/reset-password
 * Proxy to backend API for resetting password
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backendUrl = `${BACKEND_API_URL}/auth/reset-password`;

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error("Error during reset-password proxy:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
