import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * POST /api/auth/register
 * Proxy to backend API for user registration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = `${BACKEND_API_URL}/auth/signup`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        ...getProxyHeaders(req),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    console.log(`[Register] Request to ${backendUrl} ended with status ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Register] Backend error (${response.status}):`, text.slice(0, 500));
      return new NextResponse(text, { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') || 'text/html' } });
    }

    const data = await response.json();

    // Forward set-cookie headers from backend
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
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
