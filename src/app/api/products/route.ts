import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";

const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
  return url.endsWith('/api') ? url : `${url}/api`;
};

const BACKEND_API_URL = getBackendUrl();

/**
 * GET /api/products
 * Proxy to backend API for products
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Forward all query params to backend
    const backendUrl = `${BACKEND_API_URL}/products?${searchParams.toString()}`;
    console.log(`[ProductsAPI] Fetching from: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: getProxyHeaders(req),
      cache: "no-store",
    });

    const data = await response.json();
    console.log(`[ProductsAPI] Backend response success: ${response.ok}, items: ${Array.isArray(data?.data) ? data.data.length : 'unknown'}`);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching products from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Proxy to backend API for product creation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = `${BACKEND_API_URL}/products`;
    console.log(`[ProductsAPI] Posting to: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        ...getProxyHeaders(req),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();
    console.log(`[ProductsAPI] Backend POST response success: ${response.ok}`);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating product in backend:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
