import { NextRequest, NextResponse } from "next/server";
import { getCookieString } from "@/lib/server-auth";
import { getBackendUrl } from "@/lib/backend-api";

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
    try {
        const cookieString = await getCookieString();
        const headers = {
            'Content-Type': 'application/json',
            'Cookie': cookieString,
        };

        // Parallel fetch for all stats
        const [
            usersRes,
            productsRes,
            ordersRes,
            couponsRes,
            slidersRes,
            bannersRes,
            categoriesRes
        ] = await Promise.all([
            fetch(`${getBackendUrl()}/users/stats/summary`, { headers, cache: 'no-store' }),
            fetch(`${getBackendUrl()}/products/stats/summary`, { headers, cache: 'no-store' }),
            fetch(`${getBackendUrl()}/order/stats`, { headers, cache: 'no-store' }),
            fetch(`${getBackendUrl()}/coupons/stats`, { headers, cache: 'no-store' }),
            fetch(`${getBackendUrl()}/slide/stats`, { headers, cache: 'no-store' }),
            fetch(`${getBackendUrl()}/banners/stats`, { headers, cache: 'no-store' }),
            fetch(`${getBackendUrl()}/categories/stats`, { headers, cache: 'no-store' }),
        ]);

        // Helper to safely parse JSON
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const safeJson = async (res: Response, defaultVal: any, name: string) => {
            try {
                if (!res.ok) {
                    console.error(`[Stats] Error fetching ${name}: ${res.status} ${res.statusText}`);
                    return defaultVal;
                }
                return await res.json();
            } catch (e) {
                console.error(`[Stats] JSON parse error for ${name}:`, e);
                return defaultVal;
            }
        };

        const [
            usersData,
            productsData,
            ordersData,
            couponsData,
            slidersData,
            bannersData,
            categoriesData
        ] = await Promise.all([
            safeJson(usersRes, { data: { totalUsers: 0, adminUsers: 0, regularUsers: 0 } }, 'users'),
            safeJson(productsRes, { data: { totalProducts: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 } }, 'products'),
            safeJson(ordersRes, { data: { totalOrders: 0, totalRevenue: 0 } }, 'orders'),
            safeJson(couponsRes, { data: { totalCoupons: 0, activeCoupons: 0, usedCoupons: 0 } }, 'coupons'),
            safeJson(slidersRes, { data: { totalSliders: 0, activeSliders: 0, withImages: 0 } }, 'sliders'),
            safeJson(bannersRes, { data: { totalBanners: 0, activeBanners: 0 } }, 'banners'),
            safeJson(categoriesRes, { data: { totalCategories: 0, avgProductsPerCategory: 0 } }, 'categories'),
        ]);

        const ordersCount = ordersData.data?.totalOrders || 0;
        const ordersRevenue = ordersData.data?.totalRevenue || 0;

        const stats = {
            users: {
                total: usersData.data?.totalUsers || 0,
                admins: usersData.data?.adminUsers || 0,
                regular: usersData.data?.regularUsers || 0,
            },
            products: {
                total: productsData.data?.totalProducts || 0,
                totalValue: productsData.data?.totalValue || 0,
                lowStock: productsData.data?.lowStockCount || 0,
                outOfStock: productsData.data?.outOfStockCount || 0,
            },
            orders: {
                total: ordersCount,
                revenue: ordersRevenue,
                avgOrderValue: ordersCount > 0 ? ordersRevenue / ordersCount : 0,
            },
            coupons: {
                total: couponsData.data?.totalCoupons || 0,
                active: couponsData.data?.activeCoupons || 0,
                used: couponsData.data?.usedCoupons || 0,
            },
            sliders: {
                total: slidersData.data?.totalSliders || 0,
                active: slidersData.data?.activeSliders || 0,
                withImages: slidersData.data?.withImages || 0,
            },
            banners: {
                total: bannersData.data?.totalBanners || 0,
                active: bannersData.data?.activeBanners || 0,
            },
            categories: {
                total: categoriesData.data?.totalCategories || 0,
                avgProducts: categoriesData.data?.avgProductsPerCategory || 0,
            },
        };

        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error("Error fetching analytics overview:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
