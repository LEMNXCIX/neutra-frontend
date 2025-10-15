import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readProducts, writeProducts, findProduct } from '@/data/products';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'orders.json');

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
};

function readOrders(): Order[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

function writeOrders(arr: Order[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(arr, null, 2), 'utf-8');
}

// inventory is stored as `stock` inside products.json now

export async function GET(req: Request) {
  const url = new URL(req.url);
  // Prefer server-side session to identify user
  const cookieHeader = req.headers.get('cookie') || '';
  const cookiePairs = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
  let rawSid: string | undefined;
  for (const p of cookiePairs) {
    const [k, ...v] = p.split('=');
    if (k === '_neutra_sid') rawSid = decodeURIComponent(v.join('='));
  }
  const { getUserId } = await import('@/lib/session');
  const cookieUserId = getUserId(rawSid);
  const userId = cookieUserId || url.searchParams.get('userId');
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Number(url.searchParams.get('pageSize') || '10');
  const status = url.searchParams.get('status') || '';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const all = readOrders();
  let filtered = all.slice();
  filtered = filtered.filter(o => o.userId === userId);
  if (status) filtered = filtered.filter(o => o.status === status);
  if (dateFrom) filtered = filtered.filter(o => new Date(o.date) >= new Date(dateFrom));
  if (dateTo) filtered = filtered.filter(o => new Date(o.date) <= new Date(dateTo));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return NextResponse.json({ orders: paged, total, page, pageSize });
}

export async function POST(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookiePairs = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
  let rawSid: string | undefined;
  for (const p of cookiePairs) {
    const [k, ...v] = p.split('=');
    if (k === '_neutra_sid') rawSid = decodeURIComponent(v.join('='));
  }
  const { getUserId } = await import('@/lib/session');
  const userId = getUserId(rawSid);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.items || !Array.isArray(body.items)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Validate items against server-side product list and compute total
  const itemsIn = body.items as Array<{ id: string; qty: number }>;
  if (itemsIn.length === 0) return NextResponse.json({ error: 'No items' }, { status: 400 });

  const resolvedItems: OrderItem[] = [];
  let computedTotal = 0;

  for (const it of itemsIn) {
    if (!it || typeof it.id !== 'string' || typeof it.qty !== 'number') {
      return NextResponse.json({ error: 'Invalid item format' }, { status: 400 });
    }
    if (it.qty <= 0 || !Number.isInteger(it.qty) || it.qty > 999) {
      return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
    }
    const prod = findProduct(it.id);
    if (!prod) {
      return NextResponse.json({ error: `Unknown product id: ${it.id}` }, { status: 400 });
    }
    const price = Number(prod.price || 0);
    const line = price * it.qty;
    resolvedItems.push({ id: prod.id, name: prod.title, qty: it.qty, price });
    computedTotal += line;
  }

  // Check inventory availability for all items before committing
  const products = readProducts();
  for (const it of itemsIn) {
    const prod = products.find(p => p.id === it.id);
    const available = prod?.stock ?? 0;
    if (it.qty > available) {
      return NextResponse.json({ error: `Insufficient stock for ${it.id}`, available }, { status: 400 });
    }
  }

  const all = readOrders();
  const id = `o${Date.now()}`;
  const newOrder: Order = {
    id,
    userId,
    total: Number(computedTotal.toFixed(2)),
    status: 'processing',
    tracking: '',
    address: String(body.address || ''),
    items: resolvedItems,
    date: new Date().toISOString().slice(0,10),
  };
  all.unshift(newOrder);
  writeOrders(all);

  // decrement product stock and persist
  const productsAfter = readProducts();
  for (const it of itemsIn) {
    const idx = productsAfter.findIndex(p => p.id === it.id);
    if (idx >= 0) {
      productsAfter[idx].stock = Math.max(0, (productsAfter[idx].stock || 0) - it.qty);
    }
  }
  writeProducts(productsAfter);

  return NextResponse.json({ order: newOrder }, { status: 201 });
}
