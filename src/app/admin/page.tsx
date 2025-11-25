import fs from 'fs';
import path from 'path';
import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserId } from '@/lib/session';
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import AnalyticsChartsDetailed from "@/components/admin/AnalyticsChartsDetailed";

type User = { id: string; name: string; email: string; password?: string; isAdmin?: boolean };

export default async function AdminPage() {
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie') || '';
    const pairs = cookieHeader.split(';').map((s: string) => s.trim()).filter(Boolean);
    let rawSid: string | undefined;
    for (const p of pairs) {
        const [k, ...v] = p.split('=');
        if (k === '_neutra_sid') rawSid = decodeURIComponent(v.join('='));
    }
    const userId = getUserId(rawSid || null);
    if (!userId) return redirect('/login');

    const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');
    let users: User[] = [];
    try {
        const raw = fs.readFileSync(USERS_PATH, 'utf-8');
        users = JSON.parse(raw) as User[];
    } catch {
        users = [];
    }

    const me = users.find(u => u.id === userId);
    if (!me || !me.isAdmin) return redirect('/');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold capitalize">Dashboard</h2>
            <AnalyticsOverview />
            <AnalyticsCharts />
            <AnalyticsChartsDetailed />
        </div>
    );
}
