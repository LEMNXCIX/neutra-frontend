import { NextRequest, NextResponse } from "next/server";
import { backendGet } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
    try {
        const token = extractTokenFromRequest(req);
        // Forward query parameters (e.g. status)
        const searchParams = req.nextUrl.search;

        // Proxy to /order/getOrderByUser
        const result = await backendGet(`/order/getOrderByUser${searchParams}`, token);

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
