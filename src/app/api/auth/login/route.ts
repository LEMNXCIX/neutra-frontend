/**
 * API Routes for Authentication - Login
 */

import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { logger } from "@/lib/logger";

const getBackendUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
    return url.endsWith("/api") ? url : `${url}/api`;
};

const BACKEND_API_URL = getBackendUrl();

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const endpoint = "/auth/login";
    const logContext = logger.createContext(endpoint, "POST");

    try {
        const body = await req.json();
        logger.info(logContext, `Auth Request: Login attempt`);

        const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
            method: "POST",
            headers: {
                ...getProxyHeaders(req),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data =
            response.status === 204
                ? {
                      success: true,
                      statusCode: response.status,
                      message: "Login successful",
                  }
                : await response.json().catch(() => ({
                      success: response.ok,
                      statusCode: response.status,
                      message: response.ok
                          ? "Login successful"
                          : "Login failed",
                  }));
        const duration = Date.now() - startTime;

        // Forward set-cookie headers from backend
        const setCookieHeader = response.headers.get("set-cookie");
        const headers: Record<string, string> = {};

        if (setCookieHeader) {
            headers["Set-Cookie"] = setCookieHeader;
        }

        if (!response.ok) {
            logger.warn(
                logger.withResponse(
                    logContext,
                    data,
                    response.status,
                    duration,
                ),
                `Auth Response: Login failed`,
            );
            return NextResponse.json(data, {
                status: response.status,
                headers,
            });
        }

        logger.info(
            logger.withResponse(
                logContext,
                { success: true },
                response.status,
                duration,
            ),
            `Auth Response: Login successful`,
        );

        return NextResponse.json(data, {
            status: response.status,
            headers,
        });
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const message =
            error instanceof Error ? error.message : "Unknown login error";
        logger.error(
            logger.withError(logContext, error, duration),
            `Auth Error: ${message}`,
        );
        return NextResponse.json(
            { success: false, message: "Login failed" },
            { status: 500 },
        );
    }
}
