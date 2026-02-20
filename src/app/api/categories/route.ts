import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * GET /api/categories
 * Proxy to backend API for categories
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const backendUrl = `${BACKEND_API_URL}/categories?${searchParams.toString()}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: getProxyHeaders(req),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching categories from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Proxy to backend API for category creation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = `${BACKEND_API_URL}/categories`;

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
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating category in backend:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
