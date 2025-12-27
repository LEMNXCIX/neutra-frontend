
import React from 'react';
import { redirect } from 'next/navigation';
import CategoriesTableClient from "@/components/admin/categories/CategoriesTableClient";
import { validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default async function GlobalCategoriesPage({ searchParams }: { searchParams: any }) {
    const { isValid, cookieHeader } = await validateAdminAccess();
    if (!isValid) redirect('/login');

    const params = await searchParams;
    const query = new URLSearchParams(params);
    query.set('tenantId', query.get('tenantId') || 'all');

    const response = await fetch(`${BACKEND_API_URL}/categories?${query.toString()}`, {
        headers: { 'Cookie': cookieHeader! },
        cache: 'no-store',
    });

    const data = await response.json();

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Global Categories</h2>
            <CategoriesTableClient
                categories={data.data || []}
                stats={data.data?.stats || { totalCategories: 0, totalProducts: 0, averageProductsPerCategory: 0 }}
                pagination={data.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }}
                isSuperAdmin={true}
            />
        </div>
    );
}
