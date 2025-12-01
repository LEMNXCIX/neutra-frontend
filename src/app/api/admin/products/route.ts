import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/products
 * Proxy to backend API for products
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);
    const result = await backendGet('/products', token);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error fetching products from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Create product via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/products', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
