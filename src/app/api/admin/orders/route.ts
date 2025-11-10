import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const ORDERS_PATH = path.join(process.cwd(), 'src', 'data', 'orders.json');

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const raw = fs.readFileSync(ORDERS_PATH, 'utf-8');
    type Order = { id: string; userId: string; total: number; status: string; date: string };
    const orders = JSON.parse(raw) as Array<Order>;
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ orders: [] });
  }
}
