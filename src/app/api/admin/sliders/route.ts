import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/sliders
 * Proxy to backend API for sliders
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);
    const result = await backendGet('/slide', token);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error fetching sliders from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sliders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sliders
 * Create slider via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/slide', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating slider:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create slider" },
      { status: 500 }
    );
  }
}
