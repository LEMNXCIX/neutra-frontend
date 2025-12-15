import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4001/api";

/**
 * GET /api/cart/stats
 * Proxy to backend API to get cart statistics
 */
export async function GET(req: NextRequest) {
    try {
        const backendUrl = `${BACKEND_API_URL}/cart/stats`;

        const response = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
            },
            cache: "no-store",
        });

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error("Error fetching cart stats:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch cart stats",
                errors: [(error as Error).message],
            },
            { status: 500 }
        );
    }
}
