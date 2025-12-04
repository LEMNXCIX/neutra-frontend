import { NextRequest, NextResponse } from "next/server";
import { backendGet } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
    try {
        const token = extractTokenFromRequest(req);
        const result = await backendGet('/order/statuses', token);

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error("Error fetching order statuses:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch order statuses" },
            { status: 500 }
        );
    }
}
