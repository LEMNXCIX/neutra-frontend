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
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

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
      orders = orders.filter(o => o.date >= dateFrom);
    }
    if (dateTo) {
      orders = orders.filter(o => o.date <= dateTo);
    }

    // Calculate stats from ALL filtered orders (before pagination)
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalOrders / limit);

    return NextResponse.json({
      orders: paginatedOrders,
      stats: { totalOrders, totalRevenue, statusCounts },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalOrders,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Error reading orders:', err);
    return NextResponse.json({
      orders: [],
      stats: { totalOrders: 0, totalRevenue: 0, statusCounts: {} },
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  }
}
