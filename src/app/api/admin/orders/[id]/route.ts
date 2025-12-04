import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPut, backendDelete } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/orders/[id]
 * Get order details via backend
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<any> }
) {
    try {
        const { id } = await params;
        const token = extractTokenFromRequest(req);
        const result = await backendGet(`/order/${id}`, token);

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/orders/[id]
 * Update order via backend
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<any> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const token = extractTokenFromRequest(req);
        const result = await backendPut(`/order/${id}`, body, token);

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update order" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/orders/[id]
 * Delete order via backend
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<any> }
) {
    try {
        const { id } = await params;
        const token = extractTokenFromRequest(req);
        const result = await backendDelete(`/order/${id}`, token);

        // Handle 204 No Content
        if (result.success && !result.data) {
            return new NextResponse(null, { status: 204 });
        }

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete order" },
            { status: 500 }
        );
    }
}
