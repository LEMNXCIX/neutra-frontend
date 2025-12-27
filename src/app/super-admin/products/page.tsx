
import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import ProductsTableClient from "@/components/admin/products/ProductsTableClient";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

async function validateAdminAccess() {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');
        if (!tokenCookie) return { isValid: false, user: null };

        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');

        const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
            cache: 'no-store',
        });

        if (!response.ok) return { isValid: false, user: null };
        const data = await response.json();
        if (!data.success || !data.data?.user) return { isValid: false, user: null };

        const user = data.data.user;
        const isAdmin = user.role?.name === 'SUPER_ADMIN';
        return { isValid: isAdmin, user, cookieHeader };
    } catch (error) {
        return { isValid: false, user: null };
    }
}

export default async function GlobalProductsPage({ searchParams }: { searchParams: any }) {
    const { isValid, cookieHeader } = await validateAdminAccess();
    if (!isValid) redirect('/login');

    const params = await searchParams;
    const query = new URLSearchParams(params);
    query.set('tenantId', query.get('tenantId') || 'all');

    // Fetch products and categories for the filter
    const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${BACKEND_API_URL}/products?${query.toString()}`, { headers: { 'Cookie': cookieHeader! }, cache: 'no-store' }),
        fetch(`${BACKEND_API_URL}/categories?tenantId=all`, { headers: { 'Cookie': cookieHeader! }, cache: 'no-store' })
    ]);

    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Global Products</h2>
            <ProductsTableClient
                products={productsData.data?.products || []}
                stats={productsData.data?.stats || { totalProducts: 0, totalValue: 0, lowStockCount: 0 }}
                pagination={productsData.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }}
                categories={categoriesData.data || []}
                isSuperAdmin={true}
            />
        </div>
    );
}
