/**
 * API Routes for Authentication - Logout
 */

import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { logger } from "@/lib/logger";

const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
  return url.endsWith('/api') ? url : `${url}/api`;
};

const BACKEND_API_URL = getBackendUrl();

async function handleLogout(req: NextRequest, method: "GET" | "POST") {
  const startTime = Date.now();
  const endpoint = '/auth/logout';
  const logContext = logger.createContext(endpoint, method);

  try {
    logger.info(logContext, `Auth Request: Logout attempt`);

    const response = await fetch(`${BACKEND_API_URL}/auth/logout`, {
      method,
      headers: getProxyHeaders(req),
      cache: "no-store",
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    // Get all Set-Cookie headers from backend
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    // Create response with explicit cookie deletion as fallback
    const cookieHeader = setCookieHeaders.length > 0
      ? setCookieHeaders.join(', ')
      : 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax';

    logger.info(logger.withResponse(logContext, { success: true }, response.status, duration), `Auth Response: Logout successful`);

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Set-Cookie': cookieHeader,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(logger.withError(logContext, error, duration), `Auth Error: ${error.message}`);
    
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

export async function POST(req: NextRequest) {
  return handleLogout(req, "POST");
}

export async function GET(req: NextRequest) {
  return handleLogout(req, "GET");
}
