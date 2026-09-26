import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

/**
 * GET /api/orders/[id]
 * Proxy to backend API for single order
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${getBackendUrl()}/order/${id}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      cache: "no-store",
    });

    const data = await readJsonResponse(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching order from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
