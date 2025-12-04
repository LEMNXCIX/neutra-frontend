import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
    try {
        const token = extractTokenFromRequest(req);
        const body = await req.json();

        // Proxy to /order/getOrderByUser with userId in body
        const result = await backendGet('/order/getOrderByUser', token);

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch user orders" },
            { status: 500 }
        );
    }
}
