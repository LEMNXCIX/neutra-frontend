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
 */
export const PUT = createPutHandler((req) => {
    // This is a special case in the original code where PUT /api/admin/users 
    // takes a body with userId and updates that specific user.
    // However, the unified handler expects the ID in the URL or as a parameter.
    // For now, we'll keep it custom if needed, or if we can extract it from body.
    // Actually, createPutHandler with a function resolver could work if we can access the body early.
    // But parseBody is called inside the handler.
    
    // Let's use a simpler approach or keep it as is if it's too specific.
    return '/users'; // This will be used as base, but we need the ID.
});

// Since the original PUT had very specific logic for extracting userId from body,
// I'll implement a custom handler for it but using the common utilities.

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

        const token = extractTokenFromRequest(req);
        const result = await backendPut(`/users/${userId}`, updateData, token);

        return NextResponse.json(result, { status: result.statusCode || 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
