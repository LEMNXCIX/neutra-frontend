/**
 * API Routes for Admin Users - Refactored with unified handler
 */

import { createPutHandler, createListWithStatsHandler } from '@/lib/api-route-handler';

/**
 * GET /api/admin/users
 * Proxy to backend API for users list + statistics with custom mapping
 */
export const GET = createListWithStatsHandler(
    '/users',
    '/users/stats/summary',
    (users: any[]) => users.map((u: any) => {
        const role = u.role || u.tenants?.[0]?.role;
        return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: role,
            isAdmin: role?.name === 'ADMIN' || role?.name === 'SUPER_ADMIN',
            profilePic: u.profilePic,
            avatar: u.profilePic
        };
    })
);

/**
 * PUT /api/admin/users
 * Update user via backend
 * This is a special case where userId is passed in the request body.
 */
import { NextRequest, NextResponse } from "next/server";
import { backendPut } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, ...updateData } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
        }

        const token = extractTokenFromRequest(req) || undefined;
        const result = await backendPut(`/users/${userId}`, updateData, token);

        return NextResponse.json(result, { status: result.statusCode || 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
