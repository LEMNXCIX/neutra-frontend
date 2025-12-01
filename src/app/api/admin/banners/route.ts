import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/banners
 * Proxy to backend API for banners
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);
    const result = await backendGet('/banners', token);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error fetching banners from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/banners
 * Create banner via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/banners', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner" },
      { status: 500 }
    );
  }
}
