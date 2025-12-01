import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/coupons
 * Proxy to backend API for coupons
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);
    const result = await backendGet('/coupons', token);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error fetching coupons from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coupons
 * Create coupon via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/coupons', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
