/**
 * API Routes for Authentication - Signup/Register
 */

import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { logger } from "@/lib/logger";

const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
  return url.endsWith('/api') ? url : `${url}/api`;
};

const BACKEND_API_URL = getBackendUrl();

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/auth/signup';
  const logContext = logger.createContext(endpoint, 'POST');

  try {
    const body = await req.json();
    logger.info(logContext, `Auth Request: Signup attempt`);

    const response = await fetch(`${BACKEND_API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        ...getProxyHeaders(req),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    // Forward set-cookie headers from backend
    const setCookieHeader = response.headers.get("set-cookie");
    const headers: Record<string, string> = {};

    if (setCookieHeader) {
      headers["Set-Cookie"] = setCookieHeader;
    }

    if (!response.ok) {
      logger.warn(logger.withResponse(logContext, data, response.status, duration), `Auth Response: Signup failed`);
      return NextResponse.json(data, { status: response.status, headers });
    }

    logger.info(logger.withResponse(logContext, { success: true }, response.status, duration), `Auth Response: Signup successful`);

    return NextResponse.json(data, {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(logger.withError(logContext, error, duration), `Auth Error: ${error.message}`);
    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
