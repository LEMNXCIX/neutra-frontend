import { NextRequest, NextResponse } from "next/server";
import { backendDelete } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * DELETE /api/cart/clear
 * Clear all items from cart
 */
export async function DELETE(req: NextRequest) {
    try {
        const token = extractTokenFromRequest(req);
        const result = await backendDelete('/cart/clear', token);

        return NextResponse.json(result, { status: result.statusCode || 200 });
    } catch (error) {
        console.error("Error clearing cart:", error);
        return NextResponse.json(
            { success: false, message: "Failed to clear cart", statusCode: 500 },
            { status: 500 }
        );
    }
}
