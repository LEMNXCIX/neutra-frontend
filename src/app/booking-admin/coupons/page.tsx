import { cookies } from 'next/headers';
import CouponsTableClient from '@/components/admin/coupons/CouponsTableClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Coupons Management | Booking Admin',
    description: 'Manage discount coupons for appointments',
}

async function getCoupons(search: string, type: string, status: string, page: number, limit: number) {
    try {
        // Build query string
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (type && type !== 'all') queryParams.set('type', type);
        if (status && status !== 'all') queryParams.set('status', status);
        queryParams.set('page', page.toString());
        queryParams.set('limit', limit.toString());

        const queryString = queryParams.toString();

        // Server Components need absolute URLs for fetch
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/coupons${queryString ? `?${queryString}` : ''}`;

        // Get cookies to pass to BFF route
        const cookieStore = await cookies();
        const cookieHeader = cookieStore.toString();

        // Fetch from BFF route with cookies
        const response = await fetch(url, {
            cache: 'no-store',
            headers: {
                'Cookie': cookieHeader
            }
        });

        if (!response.ok) {
            return {
                coupons: [],
                stats: {
                    totalCoupons: 0,
                    usedCoupons: 0,
                    unusedCoupons: 0,
                    expiredCoupons: 0,
                    activeCoupons: 0,
                },
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                },
            };
        }

        const data = await response.json();

        return {
            coupons: data.data || [],
            stats: data.stats || {
                totalCoupons: 0,
                usedCoupons: 0,
                unusedCoupons: 0,
                expiredCoupons: 0,
                activeCoupons: 0,
                activeDiscounts: 0
            },
            pagination: data.pagination ? {
                currentPage: data.pagination.page,
                totalPages: data.pagination.totalPages,
                totalItems: data.pagination.total,
                itemsPerPage: data.pagination.limit,
            } : {
                currentPage: page,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit,
            },
        };
    } catch (err) {
        console.error("Error fetching coupons:", err);
        return {
            coupons: [],
            stats: {
                totalCoupons: 0,
                usedCoupons: 0,
                unusedCoupons: 0,
                expiredCoupons: 0,
                activeCoupons: 0,
            },
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit,
            },
        };
    }
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CouponsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
    const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
    const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "";
    const type = typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : "all";
    const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "all";

    const data = await getCoupons(search, type, status, page, limit);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
            </div>
            <CouponsTableClient
                coupons={data.coupons}
                stats={data.stats}
                pagination={data.pagination}
            />
        </div>
    )
}
