import { NextRequest, NextResponse } from "next/server";
import { backendGet } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/auth/validate
 * Validate current session
 */
export async function GET(req: NextRequest) {
    try {
        const token = extractTokenFromRequest(req);

        if (!token) {
            return NextResponse.json(
                { success: false, message: "No session token found" },
                { status: 401 }
            );
        }

        // We assume the backend has an endpoint /auth/me or similar to validate
        // Based on auth.service.ts calling /auth/validate, we try that first

        // Note: authService.validate in frontend calls /api/auth/validate (this file)
        // This file should call backend's validation endpoint.

        // Common pattern is /auth/me or /auth/profile for validation
        // Let's try /auth/validate as per the service name, or /auth/me if that fails

        const result = await backendGet('/auth/validate', token);

        if (!result.success && result.statusCode === 404) {
            // Fallback to /auth/me if /auth/validate doesn't exist on backend
            const resultMe = await backendGet('/auth/me', token);
            if (!resultMe.success) {
                return NextResponse.json(resultMe, { status: resultMe.statusCode || 401 });
            }
            return NextResponse.json({ ...resultMe, user: resultMe.data });
        }

        if (!result.success) {
            return NextResponse.json(result, { status: result.statusCode || 401 });
        }

        return NextResponse.json(result.data);
    } catch (error: any) {
        console.error("Error validating session:", error);
        const status = error.statusCode || error.status || 500;
        return NextResponse.json(
            { error: error.message || "Failed to validate session" },
            { status }
        );
    }
}
