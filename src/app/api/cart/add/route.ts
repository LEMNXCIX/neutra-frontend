import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4001/api";

/**
 * POST /api/cart/add
 * Proxy to backend API to add item to cart
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backendUrl = `${BACKEND_API_URL}/cart/add`;

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await response.json();

        // Forward cookies if any
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        const headers: Record<string, string> = {};

        if (setCookieHeaders.length > 0) {
            headers["Set-Cookie"] = setCookieHeaders.join(', ');
        }

        return NextResponse.json(data, {
            status: response.status,
            headers,
        });
    } catch (error) {
        console.error("Error adding item to cart:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to add item to cart",
                errors: [(error as Error).message],
            },
            { status: 500 }
        );
    }
}
