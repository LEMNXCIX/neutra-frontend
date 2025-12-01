import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/orders
 * Proxy to backend API for orders
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);
    const result = await backendGet('/orders', token);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error fetching orders from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders
 * Create order via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/orders', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
