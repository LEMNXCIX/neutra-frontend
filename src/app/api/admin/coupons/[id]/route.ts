import { NextRequest, NextResponse } from "next/server";
import { backendPut, backendDelete } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * PUT /api/admin/coupons/[id]
 * Update coupon via backend
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const token = extractTokenFromRequest(req);
        const result = await backendPut(`/coupons/${id}`, body, token);

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error("Error updating coupon:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update coupon" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/coupons/[id]
 * Delete coupon via backend
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = extractTokenFromRequest(req);
        const result = await backendDelete(`/coupons/${id}`, token);

        // Handle 204 No Content
        if (result.success && !result.data) {
            return new NextResponse(null, { status: 204 });
        }

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete coupon" },
            { status: 500 }
        );
    }
}
