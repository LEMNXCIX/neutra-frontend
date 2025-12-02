import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000/api";

/**
 * GET /api/products/[id]
 * Proxy to backend API for single product
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${BACKEND_API_URL}/products/${id}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching product from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
