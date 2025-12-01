import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/categories
 * Proxy to backend API for categories
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);
    console.log('[Categories GET] Extracted token:', token ? 'present' : 'missing');

    const result = await backendGet('/categories', token);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error fetching categories from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * Create category via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    console.log('[Categories POST] Extracted token:', token ? 'present' : 'missing');

    const result = await backendPost('/categories', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
