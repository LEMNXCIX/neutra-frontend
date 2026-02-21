/**
 * API Routes for Session Validation
 */

import { NextRequest, NextResponse } from "next/server";
import { backendGet } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const endpoint = '/auth/validate';
    const logContext = logger.createContext(endpoint, 'GET');

    try {
        const token = extractTokenFromRequest(req);

        if (!token) {
            return NextResponse.json(
                { success: false, message: "No session token found" },
                { status: 401 }
            );
        }

        logger.info(logContext, `Auth Request: Validating session`);

        // Try primary validation endpoint
        let result = await backendGet('/auth/validate', token);

        if (!result.success && result.statusCode === 404) {
            logger.info(logContext, `Auth Request: /auth/validate not found, trying fallback /auth/me`);
            // Fallback to /auth/me if /auth/validate doesn't exist on backend
            const resultMe = await backendGet('/auth/me', token);
            if (!resultMe.success) {
                const duration = Date.now() - startTime;
                logger.warn(logger.withResponse(logContext, resultMe, resultMe.statusCode || 401, duration), `Auth Response: Validation failed`);
                return NextResponse.json(resultMe, { status: resultMe.statusCode || 401 });
            }
            result = { ...resultMe, user: resultMe.data } as any;
        }

        const duration = Date.now() - startTime;

        if (!result.success) {
            logger.warn(logger.withResponse(logContext, result, result.statusCode || 401, duration), `Auth Response: Validation failed`);
            return NextResponse.json(result, { status: result.statusCode || 401 });
        }

        logger.info(logger.withResponse(logContext, { success: true }, 200, duration), `Auth Response: Session valid`);

        return NextResponse.json(result.data || result);
    } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error(logger.withError(logContext, error, duration), `Auth Error: ${error.message}`);
        const status = error.statusCode || error.status || 500;
        return NextResponse.json(
            { success: false, error: error.message || "Failed to validate session" },
            { status }
        );
    }
}
