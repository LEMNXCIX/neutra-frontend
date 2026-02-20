import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";

const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
  return url.endsWith('/api') ? url : `${url}/api`;
};

const BACKEND_API_URL = getBackendUrl();

/**
 * Shared logout logic for both GET and POST
 */
async function handleLogout(req: NextRequest, method: "GET" | "POST") {
  try {
    const backendUrl = `${BACKEND_API_URL}/auth/logout`;

    const response = await fetch(backendUrl, {
      method,
      headers: getProxyHeaders(req),
      cache: "no-store",
    });

    const data = await response.json();

    // Get all Set-Cookie headers from backend
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    // Create response with explicit cookie deletion as fallback
    const cookieHeader = setCookieHeaders.length > 0
      ? setCookieHeaders.join(', ')
      : 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax';

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Set-Cookie': cookieHeader,
      },
    });
  } catch (error) {
    console.error("Error during logout:", error);
    // Even on error, ensure cookie is deleted client-side
    return NextResponse.json(
      { success: true, message: 'Sesión cerrada localmente' },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
        }
      }
    );
  }
}

/**
 * POST /api/auth/logout
 * Proxy to backend API for logout
 */
export async function POST(req: NextRequest) {
  return handleLogout(req, "POST");
}

/**
 * GET /api/auth/logout
 * Proxy to backend API for logout (for compatibility)
 */
export async function GET(req: NextRequest) {
  return handleLogout(req, "GET");
}
