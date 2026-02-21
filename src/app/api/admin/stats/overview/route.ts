/**
 * API Routes for Admin Dashboard Stats - Refactored with unified utilities
 */

import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const endpoint = '/admin/stats/overview';
    const logContext = logger.createContext(endpoint, 'GET');

    try {
        const token = extractTokenFromRequest(req);
        logger.info(logContext, `API Request (Stats Overview): Aggregating from multiple endpoints`);

        // Parallel fetch for all stats using backendFetch for consistency
        const [
            usersRes,
            productsRes,
            ordersRes,
            couponsRes,
            slidersRes,
            bannersRes,
            categoriesRes
        ] = await Promise.all([
            backendFetch('/users/stats/summary', { method: 'GET', token }).catch(() => ({ success: false, data: { totalUsers: 0, adminUsers: 0, regularUsers: 0 } })),
            backendFetch('/products/stats/summary', { method: 'GET', token }).catch(() => ({ success: false, data: { totalProducts: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 } })),
            backendFetch('/order/stats', { method: 'GET', token }).catch(() => ({ success: false, data: { totalOrders: 0, totalRevenue: 0 } })),
            backendFetch('/coupons/stats', { method: 'GET', token }).catch(() => ({ success: false, data: { totalCoupons: 0, activeCoupons: 0, usedCoupons: 0 } })),
            backendFetch('/slide/stats', { method: 'GET', token }).catch(() => ({ success: false, data: { totalSliders: 0, activeSliders: 0, withImages: 0 } })),
            backendFetch('/banners/stats', { method: 'GET', token }).catch(() => ({ success: false, data: { totalBanners: 0, activeBanners: 0 } })),
            backendFetch('/categories/stats', { method: 'GET', token }).catch(() => ({ success: false, data: { totalCategories: 0, avgProductsPerCategory: 0 } })),
        ]);

        const ordersData: any = ordersRes.data || {};
        const ordersCount = ordersData.totalOrders || 0;
        const ordersRevenue = ordersData.totalRevenue || 0;

        const usersData: any = usersRes.data || {};
        const productsData: any = productsRes.data || {};
        const couponsData: any = couponsRes.data || {};
        const slidersData: any = slidersRes.data || {};
        const bannersData: any = bannersRes.data || {};
        const categoriesData: any = categoriesRes.data || {};

        const stats = {
            users: {
                total: usersData.totalUsers || 0,
                admins: usersData.adminUsers || 0,
                regular: usersData.regularUsers || 0,
            },
            products: {
                total: productsData.totalProducts || 0,
                totalValue: productsData.totalValue || 0,
                lowStock: productsData.lowStockCount || 0,
                outOfStock: productsData.outOfStockCount || 0,
            },
            orders: {
                total: ordersCount,
                revenue: ordersRevenue,
                avgOrderValue: ordersCount > 0 ? ordersRevenue / ordersCount : 0,
            },
            coupons: {
                total: couponsData.totalCoupons || 0,
                active: couponsData.activeCoupons || 0,
                used: couponsData.usedCoupons || 0,
            },
            sliders: {
                total: slidersData.totalSliders || 0,
                active: slidersData.activeSliders || 0,
                withImages: slidersData.withImages || 0,
            },
            banners: {
                total: bannersData.totalBanners || 0,
                active: bannersData.activeBanners || 0,
            },
            categories: {
                total: categoriesData.totalCategories || 0,
                avgProducts: categoriesData.avgProductsPerCategory || 0,
            },
        };

        const duration = Date.now() - startTime;
        const result = { success: true, data: stats };
        
        logger.info(logger.withResponse(logContext, result, 200, duration), `API Response: Success (Stats Aggregated)`);

        return NextResponse.json(result);

    } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error(logger.withError(logContext, error, duration), `API Error: ${error.message}`);
        
        return NextResponse.json(
            { success: false, message: "Failed to fetch analytics", meta: { traceId: logContext.traceId } },
            { status: 500 }
        );
    }
}
