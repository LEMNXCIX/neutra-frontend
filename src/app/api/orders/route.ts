import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000/api";

/**
 * GET /api/orders
 * Proxy to backend API for orders
 */
export async function GET(req: NextRequest) {
  try {
    const backendUrl = `${BACKEND_API_URL}/order`;

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
    console.error("Error fetching orders from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Proxy to backend API to create order
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = `${BACKEND_API_URL}/order/create`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
