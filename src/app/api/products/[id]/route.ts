import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

/**
 * GET /api/products/[id]
 * Proxy to backend API for single product
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${getBackendUrl()}/products/${id}`;

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
    console.error("Error fetching product from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id]
 * Proxy to backend API for product update
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const backendUrl = `${getBackendUrl()}/products/${id}`;

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await readJsonResponse(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating product in backend:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Proxy to backend API for product deletion
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${getBackendUrl()}/products/${id}`;

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      cache: "no-store",
    });

    const data = await readJsonResponse(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting product in backend:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
