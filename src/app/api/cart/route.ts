import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000/api";

/**
 * GET /api/cart
 * Proxy to backend API for cart
 */
export async function GET(req: NextRequest) {
  try {
    const backendUrl = `${BACKEND_API_URL}/cart`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await response.json();

    // Backend returns StandardResponse, just forward it
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching cart from backend:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch cart", statusCode: 500 },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Proxy to backend API to add item to cart
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = `${BACKEND_API_URL}/cart/add`;

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

    // Backend returns StandardResponse, just forward it
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add item to cart", statusCode: 500 },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Proxy to backend API to remove item from cart
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: "Item ID required", statusCode: 400 },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/cart/remove/${itemId}`;

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      cache: "no-store",
    });

    const data = await response.json();

    // Backend returns StandardResponse, just forward it
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove item from cart", statusCode: 500 },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cart
 * Proxy to backend API to update cart item quantity
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = `${BACKEND_API_URL}/cart/add`; // Backend uses add for update too

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      body: JSON.stringify({ productId: body.id, quantity: body.qty }),
      cache: "no-store",
    });

    const data = await response.json();

    // Backend returns StandardResponse, just forward it
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update cart", statusCode: 500 },
      { status: 500 }
    );
  }
}
