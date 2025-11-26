import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * POST /api/auth/logout
 * Proxy to backend API for logout
 */
export async function POST(req: NextRequest) {
  try {
    const backendUrl = `${BACKEND_API_URL}/auth/logout`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("cookie") && { Cookie: req.headers.get("cookie")! }),
      },
      cache: "no-store",
    });

    const data = await response.json();

    // Forward set-cookie headers to clear cookies
    const setCookieHeader = response.headers.get("set-cookie");
    const headers: Record<string, string> = {};

    if (setCookieHeader) {
      headers["Set-Cookie"] = setCookieHeader;
    }

    return NextResponse.json(data, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  }
}
