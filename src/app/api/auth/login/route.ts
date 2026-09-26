/**
 * API Routes for Authentication - Login
 */

import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { logger } from "@/lib/logger";
import { getBackendUrl } from "@/lib/backend-url";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const endpoint = "/auth/login";
    const logContext = logger.createContext(endpoint, "POST");

    try {
        const body = await req.json();
        logger.info(logContext, `Auth Request: Login attempt`);

        const response = await fetch(`${getBackendUrl()}/auth/login`, {
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
                      message: "Sesión iniciada",
                  }
                : await response.json().catch(() => ({
                      success: response.ok,
                      statusCode: response.status,
                      message: response.ok
                          ? "Sesión iniciada"
                          : "Error al iniciar sesión",
                  }));
        const duration = Date.now() - startTime;

        // Forward set-cookie headers from backend
        const setCookieHeader = response.headers.get("set-cookie");
        const headers: Record<string, string> = {};

        if (setCookieHeader) {
            // Browsers reject Domain=.localhost; keep the auth cookie host-only.
            headers["Set-Cookie"] = setCookieHeader.replace(
                /;\s*Domain=(?:\.)?localhost/gi,
                "",
            );
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
            error instanceof Error ? error.message : "Error desconocido al iniciar sesión";
        logger.error(
            logger.withError(logContext, error, duration),
            `Auth Error: ${message}`,
        );
        return NextResponse.json(
            { success: false, message: "Error al iniciar sesión" },
            { status: 500 },
        );
    }
}
