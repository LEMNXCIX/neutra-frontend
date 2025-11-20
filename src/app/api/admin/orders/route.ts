import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const ORDERS_PATH = path.join(process.cwd(), 'src', 'data', 'orders.json');

type OrderItem = { id: string; name: string; qty: number; price: number };
type Order = {
  id: string;
  userId: string;
  total: number;
  status: string;
  tracking: string;
  address: string;
  items: OrderItem[];
  date: string;
  coupon?: {
    code: string;
    type: string;
    value: number;
    discount: number;
  };
};

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') || '';
  const searchQuery = url.searchParams.get('search') || '';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';

  try {
    const raw = fs.readFileSync(ORDERS_PATH, 'utf-8');
    let orders = JSON.parse(raw) as Array<Order>;

    // Apply filters
    if (statusFilter) {
      orders = orders.filter(o => o.status === statusFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      orders = orders.filter(o =>
        o.id.toLowerCase().includes(query) ||
        o.userId.toLowerCase().includes(query)
      );
    }
    if (dateFrom) {
      orders = orders.filter(o => new Date(o.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      orders = orders.filter(o => new Date(o.date) <= new Date(dateTo));
    }

    // Calculate statistics
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      orders,
      stats: {
        totalOrders: orders.length,
        totalRevenue,
        statusCounts
      }
    });
  } catch {
    return NextResponse.json({
      orders: [],
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        statusCounts: {}
      }
    });
  }
}
