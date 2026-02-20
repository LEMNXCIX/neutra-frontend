
import React from 'react';
import { redirect } from 'next/navigation';
import ProductsTableClient from "@/components/admin/products/ProductsTableClient";
import { validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

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
                categories={categoriesData.data?.categories || categoriesData.data || []}
                isSuperAdmin={true}
            />
        </div>
    );
}
