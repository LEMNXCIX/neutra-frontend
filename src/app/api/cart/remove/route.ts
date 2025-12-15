import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4001/api";

/**
 * PUT /api/cart/remove
 * Proxy to backend API to remove item from cart
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const backendUrl = `${BACKEND_API_URL}/cart/remove`;

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

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to remove item from cart",
                errors: [(error as Error).message],
            },
            { status: 500 }
        );
    }
}
